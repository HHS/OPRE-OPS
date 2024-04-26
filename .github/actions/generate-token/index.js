const jwt = require('jsonwebtoken');
const axios = require('axios');

async function generateToken() {
    if (!process.env.APP_ID || !process.env.PRIVATE_KEY || !process.env.INSTALLATION_ID) {
        console.error('Required environment variables are missing');
        process.exit(1);
    }

    const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
    const token = jwt.sign({
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (10 * 60), // JWT valid for 10 minutes
        iss: process.env.APP_ID
    }, privateKey, { algorithm: 'RS256' });

    try {
        const response = await axios.post(
            `https://api.github.com/app/installations/${process.env.INSTALLATION_ID}/access_tokens`,
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
