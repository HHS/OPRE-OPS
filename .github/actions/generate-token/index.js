const jwt = require('jsonwebtoken');
const axios = require('axios');

async function generateToken() {
    const appId = process.env.INPUT_APP_ID;
    const privateKey = process.env.INPUT_PRIVATE_KEY.replace(/\\n/g, '\n');
    const installationId = process.env.INPUT_INSTALLATION_ID;

    if (!appId || !privateKey || !installationId) {
        console.error('Required inputs are missing');
        process.exit(1);
    }

    const token = jwt.sign({
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (10 * 60), // JWT valid for 10 minutes
        iss: appId
    }, privateKey, { algorithm: 'RS256' });

    try {
        const response = await axios.post(
            `https://api.github.com/app/installations/${installationId}/access_tokens`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );
        console.log(`::set-output name=token::${response.data.token}`);
    } catch (error) {
        console.error('Failed to generate installation token:', error.message);
        process.exit(1);
    }
}

generateToken();
