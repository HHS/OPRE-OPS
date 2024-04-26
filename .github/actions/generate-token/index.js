const jwt = require('jsonwebtoken');
const axios = require('axios');

async function generateToken(appId, privateKey, installationId) {
    const payload = {
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (10 * 60), // JWT valid for 10 minutes
        iss: appId
    };

    const jwtToken = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

    try {
        const response = await axios.post(
            `https://api.github.com/app/installations/${installationId}/access_tokens`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );
        return response.data.token;
    } catch (error) {
        console.error('Failed to generate installation token:', error);
        process.exit(1);
    }
}

const appId = process.env.APP_ID;
const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
const installationId = process.env.INSTALLATION_ID;

generateToken(appId, privateKey, installationId).then(token => {
    console.log(`::set-output name=token::${token}`);
});
