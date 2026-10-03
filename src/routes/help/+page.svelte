<script lang="ts">
  import { resolve } from "$app/paths";
  import HomeButton from "#lib/HomeButton.svelte";
  import ExternalLink from "#lib/ExternalLink.svelte";
  import Faq from "#lib/Faq.svelte";
</script>

<svelte:head>
  <title>Helix Plugin FAQ: How to Install Plugins in Helix Editor</title>
  <meta
    name="description"
    content="Helix doesn't support plugins in its releases yet. Learn how to build Helix with Steel, then install, update and remove plugins with forge."
  />
  <link rel="canonical" href="https://helix-editor-plugins.com/help" />
</svelte:head>

<HomeButton />

<article class="help">
  <h1>Helix plugin FAQ</h1>

  <Faq id="supported" question="Does Helix support plugins?">
    <p>
      Not in its official releases yet. Matthew Paras is developing the plugin system in
      <ExternalLink href="https://github.com/helix-editor/helix/pull/8675">
        pull request #8675
      </ExternalLink>
      using
      <ExternalLink href="https://github.com/mattwparas/steel">Steel</ExternalLink>, a Scheme
      dialect made by him. The pull request hasn't been merged into <code>master</code> yet. To use
      plugins, you'll need to build Helix from that branch yourself,
      <a href="#install">as described below</a>.
    </p>
  </Faq>

  <Faq id="install" question="How do I install plugins in Helix?">
    <p>
      These steps are adapted from
      <ExternalLink href="https://github.com/mattwparas/helix/blob/steel-event-system/STEEL.md">
        STEEL.md
      </ExternalLink>
      and the <ExternalLink href="https://github.com/mattwparas/vim.hx">vim.hx README</ExternalLink
      >.
    </p>

    <h3>1. Build Helix from the <code>steel-event-system</code> branch</h3>
    <pre>git clone https://github.com/mattwparas/helix.git
cd helix
git checkout steel-event-system
cargo xtask steel</pre>
    <p>
      This builds and installs Helix with Steel support, as well as the <code>steel</code>
      executable, the Steel language server, and Steel's package manager <code>forge</code>. You'll
      need <ExternalLink href="https://rustup.rs/">Rust</ExternalLink> installed for this.
    </p>

    <h3>2. Install the plugin with <code>forge</code></h3>
    <p>For example, to install <code>vim.hx</code>:</p>
    <pre>forge pkg install --git https://github.com/mattwparas/vim.hx.git</pre>
    <p>Most plugins list the exact command in their README.</p>

    <h3>3. Require the plugin in <code>init.scm</code></h3>
    <p>
      Add a line to the top of your <a href="#init-scm"><code>init.scm</code></a> to load the
      plugin. The path to require differs per plugin, so check its README. For <code>vim.hx</code>,
      it's:
    </p>
    <pre>(require "vim-hx/init.scm")</pre>
    <p>
      Some plugins need to be configured after requiring them. <code>vim.hx</code>, for example,
      also needs this line in <code>init.scm</code>:
    </p>
    <pre>(set-vim-keybindings!)</pre>

    <h3>4. Reload the configuration</h3>
    <p>Restart Helix, or run <code>:config-reload</code> if it's already running.</p>
  </Faq>

  <Faq id="packages" question="Can I install Helix with Steel without building it myself?">
    <p>On some systems, yes:</p>
    <ul>
      <li>
        <strong>Arch Linux:</strong> the AUR package
        <ExternalLink href="https://aur.archlinux.org/packages/helix-steel-git"
          >helix-steel-git</ExternalLink
        > builds the Steel branch for you. It replaces the regular <code>helix</code> package.
      </li>
      <li>
        <strong>Nix:</strong> use the <code>steelix</code> package, and install plugins with
        <ExternalLink href="https://codeberg.org/maxschipper/helix-plugins-nix"
          >helix-plugins-nix</ExternalLink
        > instead of <code>forge</code>. With Home Manager, you can also use
        <ExternalLink href="https://github.com/Ra77a3l3-jar/nhx">nhx</ExternalLink>, which installs
        and configures plugins and generates your <code>init.scm</code>.
      </li>
    </ul>
    <p>Otherwise, you'll need to <a href="#install">build it yourself</a>.</p>
  </Faq>

  <Faq id="find" question="Where can I find plugins?">
    <ul>
      <li>
        The <ExternalLink href="https://github.com/npupko/awesome-helix#plugins">
          awesome-helix
        </ExternalLink>
        list has a section for plugins, among other Helix resources.
      </li>
      <li>
        People share plugins on the
        <ExternalLink href="https://www.reddit.com/r/HelixEditor/">r/HelixEditor</ExternalLink>
        subreddit.
      </li>
      <li>
        This very website has a <a href={resolve("/")}>list of plugins</a>.
      </li>
    </ul>
  </Faq>

  <Faq id="init-scm" question="Where is init.scm?">
    <p>In Helix's config directory, next to <code>config.toml</code>:</p>
    <ul>
      <li><strong>Linux and macOS:</strong> <code>~/.config/helix/</code></li>
      <li><strong>Windows:</strong> <code>%AppData%\helix\</code></li>
    </ul>
    <p>
      Building Helix with <code>cargo xtask steel</code> creates it for you if it doesn't exist yet.
      If you can't find it, <code>hx --health</code> shows which config directory Helix uses.
    </p>
  </Faq>

  <Faq id="helix-scm" question="What's the difference between init.scm and helix.scm?">
    <p>Both live in Helix's config directory:</p>
    <ul>
      <li>
        <code>helix.scm</code> is loaded first. Every function it provides becomes a typed command
        you can run with <code>:</code>.
      </li>
      <li>
        <code>init.scm</code> runs right after it and has access to the editor, which is why that's where
        you require and configure plugins.
      </li>
    </ul>
  </Faq>

  <Faq id="update" question="How do I update a plugin?">
    <p>Install it again with <code>--force</code>:</p>
    <pre>forge pkg install --git https://github.com/mattwparas/vim.hx.git --force</pre>
    <p>Then restart Helix, or run <code>:config-reload</code>.</p>
  </Faq>

  <Faq id="uninstall" question="How do I uninstall a plugin?">
    <p>
      Remove the plugin's lines from <code>init.scm</code>, then uninstall it with
      <code>forge</code>
      using its package name:
    </p>
    <pre>forge pkg uninstall vim-hx</pre>
    <p>
      For plugins installed with <code>forge</code>, the package name is the first part of the path
      you require. Run <code>forge list</code> to see the names of all installed packages.
    </p>
  </Faq>

  <Faq id="location" question="Where does forge install plugins?">
    <p>
      In the <code>cogs</code> directory inside Steel's home directory. Unless you've set the
      <code>STEEL_HOME</code> environment variable, that's:
    </p>
    <ul>
      <li><strong>Linux and macOS:</strong> <code>~/.local/share/steel/cogs</code></li>
      <li><strong>Windows:</strong> <code>%UserProfile%\.steel\cogs</code></li>
    </ul>
  </Faq>

  <Faq id="merged" question="When will plugins be available in regular Helix?">
    <p>
      There's no date yet. As of September 2026,
      <ExternalLink href="https://github.com/helix-editor/helix/pull/8675"
        >pull request #8675</ExternalLink
      >
      is still a draft. Subscribe to it on GitHub to get notified when it's merged.
    </p>
  </Faq>

  <Faq id="steel" question="What are Steel, forge and cogs?">
    <ul>
      <li>
        <ExternalLink href="https://github.com/mattwparas/steel">Steel</ExternalLink> is a Scheme implementation
        written in Rust, and the language Helix plugins are written in.
      </li>
      <li><code>forge</code> is Steel's package manager.</li>
      <li>
        Cogs are Steel packages, which is why plugins have a <code>cog.scm</code> file describing their
        name and dependencies.
      </li>
    </ul>
  </Faq>

  <Faq id="safety" question="Are plugins safe to use?">
    <p>
      Plugins are not sandboxed, so they run with the same permissions as Helix itself. This means
      they can read and change your files and run arbitrary programs. The plugins on this site are
      contributed by the community and aren't vetted, so only install plugins you trust.
    </p>
  </Faq>

  <Faq id="write" question="How do I write my own plugin?">
    <ul>
      <li>
        Start with the
        <ExternalLink
          href="https://github.com/mattwparas/helix/blob/steel-event-system/STEEL.md#writing-a-plugin"
        >
          Writing a plugin
        </ExternalLink>
        section of STEEL.md, which covers setting up the Steel language server and the APIs available
        to plugins.
      </li>
      <li><code>forge new</code> scaffolds a new package.</li>
      <li>
        Check the source code of <a href={resolve("/")}>some plugins</a> to get examples of how the Steel
        plugin system works.
      </li>
    </ul>
  </Faq>

  <Faq id="submit" question="How do I get my plugin listed on this site?">
    <p>
      Add a JSON file for it to the <code>plugins</code> directory of
      <ExternalLink href="https://github.com/gllms/helix-editor-plugins#contributing">
        this site's GitHub repository
      </ExternalLink>
      and open a pull request. Once it's merged, the site rebuilds automatically.
    </p>
  </Faq>
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

    h3 {
      margin: var(--gap-lg) 0 0.5rem;
      font-size: 1.125rem;
    }

    ul {
      margin: 0 0 0.75rem;
      padding-left: 1.25rem;
      line-height: 1.5;
      color: var(--grey);
    }

    li + li {
      margin-top: 0.25rem;
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
      white-space: nowrap;
    }

    :global(a) {
      text-decoration: underline;
    }

    :global(.external-link-icon) {
      margin-left: 0.125em;
      vertical-align: -0.125em;
    }
  }
</style>
