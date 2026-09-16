<script lang="ts">
  import IconXBold from "phosphor-icons-svelte/IconXBold.svelte";

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let dialog: HTMLDialogElement;

  $effect(() => {
    if (open) dialog.showModal();
    else dialog.close();
  });
</script>

<dialog
  class="help-dialog"
  bind:this={dialog}
  onclose={() => (open = false)}
  onclick={(event) => {
    if (event.target === dialog) dialog.close();
  }}>
  <button class="dialog-close" onclick={() => dialog.close()} aria-label="Close">
    <IconXBold />
  </button>

  <div class="dialog-content">
    <h2>Using Steel plugins in Helix</h2>
    <p>As of this writing the <a href="https://github.com/helix-editor/helix/pull/8675" target="_blank">Steel plugin branch</a> by Matthew Paras isn't merged into <code>master</code> yet. In order to use these plugins, you'll need to compile Helix from this branch yourself. The instructions below are adapted from <a href="https://github.com/mattwparas/helix/blob/steel-event-system/STEEL.md" target="_blank">STEEL.md</a> and the <a href="https://github.com/mattwparas/vim.hx" target="_blank">vim.hx README.md</a>.</p>

    <h3>1. Compile Helix from the <code>steel-event-system</code> branch</h3>
    <pre>git clone https://github.com/mattwparas/helix.git
cd helix
git checkout steel-event-system
cargo xtask steel</pre>
    <p>This builds and installs Helix with Steel support, as well as the <code>steel</code> executable, the Steel LSP, and Steel's package manager <code>forge</code>.</p>

    <h3>2. Install a plugin</h3>
    <p>First, install a plugin with <code>forge</code>. For example, to install <code>vim.hx</code>:</p>
    <pre>forge pkg install --git https://github.com/mattwparas/vim.hx.git</pre>

    <h3>3. Require the plugin in <code>init.scm</code></h3>
    <p>In order to load the plugin, you have to require the plugin from a special Steel file in the Helix runtime directory called <code>init.scm</code>. The installation process should have created it for you. The Helix runtime directory is usually <code>~/.config/helix/</code> on Linux and <code>%APPDATA%\helix\</code> on Windows, but you can check <code>hx --health</code> if unsure.</p>
    <p>When you've found or created the <code>init.scm</code> file, add the following line somewhere at the top of the file to require the plugin, replacing the <code>vim-hx/init.scm</code> with the path to your plugin. Check the plugin's documentation for the correct path.</p>
    <pre>(require "vim-hx/init.scm")</pre>
    <p>Depending on the plugin, you'll need to configure it after requiring. This too can hopefully be found in the plugin's documentation. For example, in <code>vim.hx</code>'s case, you need to add the following line to your <code>init.scm</code>:</p>
    <pre>(set-vim-keybindings!)</pre>
    
    <h3>4. Reload the configuration</h3>
    <p>Finally, run <code>:config-reload</code> if Helix is already running to reload the configuration.</p>
  </div>
</dialog>

<style>
  .help-dialog {
    --radius: var(--radius-lg);
    position: fixed;
    left: 50%;
    top: auto;
    bottom: 0;
    translate: -50% 0;
    transform-origin: bottom;
    margin: 0;
    width: min(69rem, 100%);
    max-width: calc(100vw - 4rem);
    padding: 0;
    padding-bottom: 3rem;
    margin-bottom: -3rem;
    overflow: visible;
    background: var(--purple-dark);
    color: var(--purple-light);
    border: 2px solid var(--border-subtle);
    border-bottom: none;
    border-radius: var(--radius) var(--radius) 0 0;
    box-shadow: var(--shadow-xl);

    @media (max-width: 576px) {
      max-width: calc(100vw - 2rem);
    }

    &::backdrop {
      background: rgba(0, 0, 0, 0.5);
    }

    @media (prefers-reduced-motion: no-preference) {
      transition:
        overlay 0.35s allow-discrete,
        display 0.35s allow-discrete;
      animation: dialog-squish-out 0.35s ease-in forwards;

      &[open] {
        animation: dialog-squish-in 0.45s ease-out;
      }

      &::backdrop {
        opacity: 0;
        transition:
          opacity 0.3s ease-out,
          overlay 0.3s allow-discrete,
          display 0.3s allow-discrete;
      }

      &[open]::backdrop {
        opacity: 1;

        @starting-style {
          opacity: 0;
        }
      }
    }

    .dialog-content {
      max-height: min(85vh, calc(100vh - 2rem));
      overflow-y: auto;
      margin-top: calc(var(--radius) / 2);
      padding: var(--gap-xl);
      padding-bottom: max(var(--gap-lg), env(safe-area-inset-bottom));

      @media (max-width: 576px) {
        padding: var(--gap-lg);
      }
    }

    h2 {
      margin-top: 0;
    }

    h3 {
      margin: var(--gap-lg) 0 0.5rem;
      font-family: var(--font-display-700);
      font-weight: 700;
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

    .dialog-close {
      position: absolute;
      right: 0;
      bottom: 100%;
      margin-bottom: var(--gap-md);
      display: grid;
      place-items: center;
      background: var(--purple-light);
      color: white;
      border: none;
      border-radius: 40%;
      padding: 0.75rem;
      font-size: 1.25rem;

      @media (min-width: 1400px) {
        bottom: auto;
        translate: calc(100% + var(--gap-md));
      }
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    @keyframes dialog-squish-in {
      0% {
        translate: -50% 30%;
        scale: 0.96 1;
        opacity: 0;
      }

      55% {
        translate: -50% -2%;
        scale: 0.99 1.02;
        opacity: 1;
      }

      80% {
        translate: -50% 1%;
        scale: 1.01 0.99;
      }

      100% {
        translate: -50% 0%;
        scale: 1 1;
      }
    }

    @keyframes dialog-squish-out {
      0% {
        translate: -50% 0%;
        scale: 1 1;
        opacity: 1;
      }

      25% {
        translate: -50% 1%;
        scale: 1.01 0.99;
      }

      50% {
        translate: -50% -1%;
        scale: 0.99 1.02;
        opacity: 1;
      }

      100% {
        translate: -50% 25%;
        scale: 0.96 1;
        opacity: 0;
      }
    }
  }
</style>
