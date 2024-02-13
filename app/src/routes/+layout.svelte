<script>
    import '../main.css'
</script>

<div class="h-[20vh]"></div>
<div class="grid place-content-center mb-16">
    <h1 class="mb-0 text-4xl">exanubes</h1>
    <nav>
        <a class="text-slate-400 transition-colors hover:text-slate-200" href="/">Home</a>
        <a class="text-slate-400 transition-colors hover:text-slate-200" href="/page-1">Page 1</a>
        <a class="text-slate-400 transition-colors hover:text-slate-200" href="/page-2">Page 2</a>
    </nav>
</div>
<div class="mx-auto max-w-[1000px]">
<slot/>
</div>

<style lang="postcss">
    :global(html) {
        background-color: theme(colors.slate.900);
        color: theme(colors.cyan.50)
    }
</style>