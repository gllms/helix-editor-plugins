# helix-editor-plugins

This is the source code for [helix-editor-plugins.com](https://helix-editor-plugins.com). It's a [SvelteKit](https://svelte.dev/docs/kit/introduction) project that compiles to static files served by Github Pages. The plugin data comes from the JSON files in the /plugins directory, enriched with data from Github's API during compilation.

## Contributing

If you want to add or update a plugin, simply add or update the corresponding JSON file in the /plugins directory and submit a pull request. After your PR is merged, a GitHub Actions workflow will automatically rebuild the site and deploy the changes.

By default, a repository in the format `username/repo` is assumed to be on GitHub. If the plugin is hosted somewhere else, you can prefix the repository name with one of the following prefixes, for example `codeberg:username/repo`.

| Prefix      | Host                              |
|-------------|-----------------------------------|
| `codeberg:` | [Codeberg](https://codeberg.org/) |

If you want to make changes to the site itself, you can run the project locally. Make sure `API_TOKEN_GITHUB` and `API_TOKEN_CODEBERG` are set with a valid token. One way to do this is by creating a `.env` file in the root of the project. Then you can run the following commands to install dependencies and start the development server:

```bash
npm install
npm run dev
```