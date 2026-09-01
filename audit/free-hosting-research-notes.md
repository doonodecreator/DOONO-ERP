# Free hosting research notes

## Render

Official Blueprint reference: https://render.com/docs/blueprint-spec
Official cron documentation: https://render.com/docs/cronjobs
Official static-site documentation: https://render.com/docs/static-sites
Official Postgres documentation: https://render.com/docs/postgresql-creating-connecting
Official background-worker documentation: https://render.com/docs/background-workers

Render Blueprints can define web services, static sites, background workers, cron jobs, and Postgres databases. Static sites are free to deploy and support SPA rewrites. Render's Blueprint reference states that the `free` plan is not available for background workers or cron jobs. Cron jobs have a minimum monthly charge and use UTC schedules. Render Postgres provides an internal connection string for services in the same region and has a documented Free tier with limited capacity; the Blueprint reference defaults new Postgres databases to `basic-256mb` if no plan is specified.

## Oracle Cloud

Official Always Free resources: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm

Oracle documents Always Free compute resources: up to two AMD micro VMs or the equivalent of 2 OCPUs and 12 GB memory from Ampere A1 resources, plus block storage. Resources must be created in the home region. Oracle warns that Always Free instances can be reclaimed when idle under documented thresholds and that capacity may be unavailable. This can host a Dockerized Laravel API, worker, scheduler, and database on one self-managed VM, but the user must manage OS updates, backups, firewall, deployments, monitoring, and recovery.

## Cloudflare Pages / Netlify / Vercel

Search result URLs:
https://developers.cloudflare.com/pages/platform/limits/
https://pages.cloudflare.com/
https://www.netlify.com/pricing/
https://vercel.com/pricing

These are primarily free frontend/static/serverless options. They are not direct replacements for a long-running Laravel PHP API with database, queue worker, and scheduler.

## Railway

Official free-trial documentation: https://docs.railway.com/pricing/free-trial

Railway documents a 30-day trial with a one-time $5 grant. After 30 days or when the grant is spent, the account reverts to a Free plan with $1 of free credit per month, which does not roll over. During the trial, projects are limited to 5 services and 1 GB RAM with shared CPU. Railway states that stateful volumes created by trial accounts are deleted 30 days after trial credits expire unless the account is upgraded. This makes Railway useful for a short test deployment but not a dependable free home for school data or permanent billing records.

Cloudflare Pages official limits: https://developers.cloudflare.com/pages/platform/limits/

Cloudflare Pages provides free static hosting with 500 builds per month and a 20,000-file limit per site. It is suitable for the React frontend but does not replace a long-running Laravel PHP API, queue worker, or relational database.
