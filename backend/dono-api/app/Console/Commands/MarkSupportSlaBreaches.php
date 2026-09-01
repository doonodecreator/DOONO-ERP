<?php

namespace App\Console\Commands;

use App\Models\SupportTicket;
use App\Services\ActivityLogService;
use Illuminate\Console\Command;

class MarkSupportSlaBreaches extends Command
{
    protected $signature = 'support:mark-sla-breaches';
    protected $description = 'Mark unresolved support tickets whose resolution target has passed.';

    public function handle(): int
    {
        $count = 0;
        SupportTicket::query()
            ->whereIn('status', ['open', 'in_progress', 'waiting_on_user'])
            ->whereNull('sla_breached_at')
            ->whereNotNull('resolution_due_at')
            ->where('resolution_due_at', '<', now())
            ->chunkById(100, function ($tickets) use (&$count) {
                foreach ($tickets as $ticket) {
                    $ticket->forceFill(['sla_breached_at' => now()])->save();
                    ActivityLogService::log(
                        module: 'support',
                        action: 'sla_breached',
                        description: "Support ticket {$ticket->ticket_number} exceeded its resolution target.",
                        subject: $ticket,
                        properties: ['resolution_due_at' => $ticket->resolution_due_at?->toISOString(), 'priority' => $ticket->priority],
                        schoolId: $ticket->school_id,
                    );
                    $count++;
                }
            });

        $this->info("Marked {$count} support ticket(s) as SLA-breached.");
        return self::SUCCESS;
    }
}
