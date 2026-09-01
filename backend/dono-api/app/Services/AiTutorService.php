<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class AiTutorService
{
    public function configured(): bool
    {
        return (bool) config('services.ai.enabled') && filled(config('services.ai.api_key'));
    }

    /**
     * @param array<int, array{role:string,content:string}> $messages
     * @return array{content:string, model:?string, provider:string, input_tokens:?int, output_tokens:?int}
     */
    public function answer(array $messages): array
    {
        if (! $this->configured()) {
            throw new RuntimeException('The AI tutor is not configured for this deployment.');
        }

        $payload = [
            'model' => config('services.ai.model'),
            'messages' => $messages,
            'max_completion_tokens' => max(200, (int) config('services.ai.max_completion_tokens', 1200)),
        ];

        $response = Http::withToken((string) config('services.ai.api_key'))
            ->acceptJson()
            ->asJson()
            ->timeout(45)
            ->post(config('services.ai.base_url') . '/chat/completions', $payload);

        if ($response->failed()) {
            report(new RuntimeException('AI provider request failed with HTTP ' . $response->status() . '.'));
            throw new RuntimeException('The AI tutor is temporarily unavailable. Try again shortly.');
        }

        $content = trim((string) data_get($response->json(), 'choices.0.message.content'));
        if ($content === '') {
            throw new RuntimeException('The AI tutor returned an empty answer. Try rephrasing the question.');
        }

        return [
            'content' => $content,
            'model' => data_get($response->json(), 'model'),
            'provider' => (string) parse_url((string) config('services.ai.base_url'), PHP_URL_HOST),
            'input_tokens' => data_get($response->json(), 'usage.prompt_tokens'),
            'output_tokens' => data_get($response->json(), 'usage.completion_tokens'),
        ];
    }

    public function systemPrompt(?string $studentName, ?string $className, ?string $role): string
    {
        $identity = $role === 'student'
            ? 'You are assisting a currently authenticated student in a school portal.'
            : 'You are assisting an authenticated school staff member with educational planning.';

        $prompt = <<<PROMPT
You are DOONO Tutor, a careful educational assistant inside a school operating system.
{$identity}
Explain ideas clearly for a beginner, ask a short clarifying question when needed, and use age-appropriate language.
Never reveal private records, credentials, contact details, medical notes, fees, unpublished results, or information about another learner.
Never claim to be a teacher, parent, counsellor, doctor, lawyer, or emergency service. Do not make final grading, disciplinary, medical, safeguarding, or admissions decisions.
If a question requires a teacher or trusted adult, say so and recommend the correct school workflow.
Do not help with cheating, harassment, sexual content involving minors, dangerous wrongdoing, self-harm, or evading school safety controls.
Do not invent facts from the school database. Only use information included in the conversation.
The learner or staff context is: {$studentName} {$className}.
PROMPT;

        return trim($prompt);
    }
}
