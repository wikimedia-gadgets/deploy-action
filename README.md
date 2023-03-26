## deploy-action

GitHub Action to automate user script and gadget deployments to Wikimedia wikis.

## Usage
* Setup either a [BotPassword](https://en.wikipedia.org/wiki/Special:BotPasswords) or an [owner-only OAuth2 credentials](https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose/oauth2?wpownerOnly=1) for your user account, which will get used for updating the script pages.
  * Make sure the grant to allow editing your user CSS/JSON/JavaScript is checked.
* [Save the credentials](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository) to GitHub Secrets in your repo (either the OAUTH2_TOKEN, or the USERNAME and PASSWORD). 

* Add a file `deploy.yml` under `.github/workflows`, with the content:

```yaml
name: 'deploy'
on:
  push:
    branches:
      - master
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      # Run build and ensure tests are passing before deployment
      - run: npm run --if-present build
      - run: npm run --if-present test
      - name: Deploy to Wikipedia 
        uses: wikimedia-gadgets/deploy-action@v1
        with:
          paths: 'src/myscript.js User:SD0001/myscript.js'
          apiUrl: 'https://en.wikipedia.org/w/api.php'
          
          oauth2Token: ${{ secrets.OAUTH2_TOKEN }}
          ### OR ###
          username: ${{ secrets.USERNAME }}
          password: ${{ secrets.PASSWORD }}

          # Optional, defaults to "Updating from repo at $BRANCH ($SHA)"
          # If provided, $BRANCH will be expanded to branch name, $SHA to 8-character SHA1, 
          # $SOURCE to the source file path.
          # You can also use values from the context (https://docs.github.com/en/actions/learn-github-actions/contexts#github-context) such as ${{github.repository}}
          editSummary: ''
```
This action as written above will be triggered every time a commit is pushed to master branch. For alternative trigger mechanisms (such as triggering when a release is published), refer to [GitHub docs](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#on).

### Specifying paths

Specifying single path:
```yaml
paths: 'src/myscript.js User:SD0001/myscript.js'
```
Format is repo path <space> wiki page title. Note that the repo path itself cannot contain spaces.

Specifying multiple paths:
```yaml
paths: |
  src/myscript.js User:SD0001/myscript.js
  src/mystyle.css User:SD0001/mystyle.css
```

Specifying multiple paths via wildcards:
```yaml
paths: |
  src/*.js User:SD0001/*.js
  src/*.css User:SD0001/*.css
```
