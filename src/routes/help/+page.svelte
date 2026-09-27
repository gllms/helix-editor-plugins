<script lang="ts">
  import HomeButton from "$lib/HomeButton.svelte";
</script>

<svelte:head>
  <title>Using Steel plugins in Helix - Helix Editor Plugins</title>
  <meta
    name="description"
    content="How to compile the Helix editor with Steel plugin support, and install and load plugins."
  />
  <link rel="canonical" href="https://helix-editor-plugins.com/help" />
</svelte:head>

<HomeButton />

<article class="help">
  <h1>Using Steel plugins in Helix</h1>
  <p>
    As of this writing the
    <a href="https://github.com/helix-editor/helix/pull/8675" target="_blank">
      Steel plugin branch
    </a>
    by Matthew Paras isn't merged into <code>master</code> yet. In order to use these plugins,
    you'll need to compile Helix from this branch yourself. The instructions below are adapted from
    <a href="https://github.com/mattwparas/helix/blob/steel-event-system/STEEL.md" target="_blank">
      STEEL.md
    </a>
    and the <a href="https://github.com/mattwparas/vim.hx" target="_blank">vim.hx README.md</a>.
  </p>

  <h2>1. Compile Helix from the <code>steel-event-system</code> branch</h2>
  <pre>git clone https://github.com/mattwparas/helix.git
cd helix
git checkout steel-event-system
cargo xtask steel</pre>
  <p>
    This builds and installs Helix with Steel support, as well as the <code>steel</code>
    executable, the Steel LSP, and Steel's package manager <code>forge</code>.
  </p>

  <h2>2. Install a plugin</h2>
  <p>
    First, install a plugin with <code>forge</code>. For example, to install <code>vim.hx</code>:
  </p>
  <pre>forge pkg install --git https://github.com/mattwparas/vim.hx.git</pre>

  <h2>3. Require the plugin in <code>init.scm</code></h2>
  <p>
    In order to load the plugin, you have to require the plugin from a special Steel file in the
    Helix runtime directory called <code>init.scm</code>. The installation process should have
    created it for you. The Helix runtime directory is usually <code>~/.config/helix/</code> on
    Linux and <code>%APPDATA%\helix\</code> on Windows, but you can check <code>hx --health</code> if
    unsure.
  </p>
  <p>
    When you've found or created the <code>init.scm</code> file, add the following line somewhere at
    the top of the file to require the plugin, replacing the <code>vim-hx/init.scm</code> with the path
    to your plugin. Check the plugin's documentation for the correct path.
  </p>
  <pre>(require "vim-hx/init.scm")</pre>
  <p>
    Depending on the plugin, you'll need to configure it after requiring. This too can hopefully be
    found in the plugin's documentation. For example, in <code>vim.hx</code>'s case, you need to add
    the following line to your <code>init.scm</code>:
  </p>
  <pre>(set-vim-keybindings!)</pre>

  <h2>4. Reload the configuration</h2>
  <p>
    Finally, run <code>:config-reload</code> if Helix is already running to reload the configuration.
  </p>
</article>

<style>
  .help {
    max-width: 69rem;
    margin: 3rem auto 0;
    padding: var(--gap-xl);
    background: var(--surface-2);
    border: 2px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);

    @media (max-width: 576px) {
      padding: var(--gap-lg);
    }

    h1 {
      margin: 0 0 var(--gap-md);
      font-family: var(--font-display-700);
      font-size: 2rem;
      font-weight: 700;
      text-align: left;
    }

    h2 {
      margin: var(--gap-lg) 0 0.5rem;
      font-size: 1.375rem;
    }

    pre,
    code {
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      background: var(--surface-1);
      border-radius: var(--radius-xs);
    }

    pre {
      margin: 0 0 0.75rem;
      padding: var(--gap-sm) var(--gap-md);
      overflow-x: auto;
      line-height: 1.5;
    }

    code {
      padding: 0.125em 0.375em;
      font-size: 0.9em;
    }

    a {
      text-decoration: underline;
    }

    > :last-child {
      margin-bottom: 0;
    }
  }
</style>
