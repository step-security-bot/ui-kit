import {createAppAuth} from '@octokit/auth-app';
import {readFileSync} from 'node:fs';
import {Octokit} from 'octokit';

const privateKey = readFileSync(process.env.RELEASER_PRIVATE_KEY_PATH, 'utf-8');

const authSecrets = {
  appId: process.env.RELEASER_APP_ID,
  privateKey,
  clientId: process.env.RELEASER_CLIENT_ID,
  clientSecret: process.env.RELEASER_CLIENT_SECRET,
  installationId: process.env.RELEASER_INSTALLATION_ID,
};

const octokit = new Octokit({
  authStrategy: createAppAuth,
  auth: authSecrets,
});
await octokit.request(
  `POST /repos/coveo/ui-kit/actions/runs/${process.argv[2]}/deployment_protection_rule`,
  {
    state: 'approved',
    environment_name: 'Production',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  }
);
