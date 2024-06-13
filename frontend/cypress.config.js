import { defineConfig } from "cypress";

export default defineConfig({
    e2e: {
        baseUrl: "http://localhost:3000",
        // Adding custom task logging, for better a11y output
        // ref: https://docs.cypress.io/api/commands/task#Usage
        // https://github.com/component-driven/cypress-axe#using-the-violationcallback-argument
        setupNodeEvents(on, config) {
            on("task", {
                log(message) {
                    console.log(message);
                    return null;
                },
                table(message) {
                    console.table(message);

                    return null;
                }
            });
        },
        pageLoadTimeout: 180000
    },
    video: false,
    viewportHeight: 768,
    viewportWidth: 1024,
    env: {
        testkey:
            "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2d0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktrd2dnU2xBZ0VBQW9JQkFRRHcrZE96M3oxMjFaZ2oKTzBVRklnZHZtNy9ZRFJJMUZic2ZaNjJqS2dpN3FGNG5BSzdjWGJYNiswUjh0OUtkSUR3UHRuSlRmTFA0bldIawpLL01pc2NoYUNIemhmU3dJSU1qSkZxaHV0L1E0MFFsVTJobDlFQmsvTXhZNnRpb2dKYXhlN1kySkJQSUkxZkRICjJnZzgvdHNXZFRiS3VFd0NxS2d3OUQwZU13VFFVaEhiZUlhb2RCeWI4Y2h6NXBYZW5zZ1BvemVTd3VOdlhYM04KLzYyZFVJQVZOaVNZamptRndwY3puWmV3NnpZWXBXTUY5akZwQmw4VjJzNmR1NnBIWmhMc05LSTYrVlFmTE9WaApZN1NDcU1lVm9KUDd3ZjhDNTFxT2FCWmF5V3E1VGhZNE12Q29veVlHMzNXMzRZYWZrVWo1OE9OQ3VCdDN6WEZGCnhMdUMxMEtyQWdNQkFBRUNnZ0VCQU94Q0pGdVFIZlRxaVpUUlFXUTg3c2x3REhGSXIzYzRiUlBuVkloS1ovR0UKcTNyVjRwclBqZUlhaEJVN0xOVThpMlprWEVhYVZ1RURmTHgya3BTTGRZRkFIUi8rMXpMSTRkSzEwa0ZyUFppTwo2ZlUxT0JRenVtMEtLMXM0eXFobUIwK3kzRGRnaitRMXpUSkVCQnU1U3hnRHA4cXRVbWl3N3VYQU1FUHhoV0N2Cmp3SGMwN2NvZ0g2d0ljUE1HeDJWcGowdUFtb1VpNU1OcWtFVjZDRDhHUmlqdGtUb1RPaTRoZlVpZ3ZRaklaM0QKYnB1STFoUzB3SDRTV1lOcDdHNHpGTlVLT1Rjak1WamFMaTdGeTZYemNNMkQyV1RmakczeDQ5ZnlibDIwWWVzZAppbWRTWVAwbUNVR1NRM2FsOUFtdjY1V2dDZkZ2bzZhNTJ2TExadlpUbGNFQ2dZRUEvbmFsNkhEMHBwa1p2enJWCnNxbFJpSzg4YlZYME90T1d6VncwdXp0YmZ3UDhXbnhYTTVkaGxsSkE1b254eGk2eVI3TENXZmFkcWRNNE01Z0oKMHlzcEdUQUhTMFNaQ0ZMM2ZHNElzYVJwTXhVRlpuWWdPWnJicm5FbytHQUozU1lrbXFoaWI5c3M2aVUwaGw4TwplWGFQRGlqUVVJZEVzMnVLMUFLbC9HSGJrYnNDZ1lFQThtNVVaSWFiYUU4STljVzdjbXpRZXJ6WGR1VmJ4Wjk1Cit2NWV4WElIUW1ldjl3Qm5MVUpOMmt4K3VYNFhuMUozZGNFV3I5UjQ5WEU1RU9wUlRkU2s3MC9iMkpvNmJhM1YKeHdGcGJLQWRWa1A2N0JVenpXYVdDMFBvYzZteTdMWVc3eWZTOU1hMVk3KzFXbnh5Qkl3OU10bXYwSDArVFFTSQphUjFUSDZxeXk5RUNnWUJUdVVBUFFaTU5lWlJDR2g2VHdTZ0ZlL3E2MHF3ZjZ0eFVSMEZHVlZwZWFUWlBvMWVoCnJ1NDU0bWhlTWdidHVSR0ppNlJzcXpybTFJdEtWbnp0RU9kZDFUS2hMam5YeGt5TmtUcWxFRDVZdzFMYWlvVkIKenRUM0NWNThra1RNa2E4N2Y2bWJ1aGFHRjZXM2pIRWJ2OG1EMUNQdVN3TnNzVGFsV1JXNSs0eWQzd0tCZ1FEQwpxOW5VeDBwdjNsZGhsQ0JMYUJtWkZaOG5lRkhUUlpaYitIcjlyZTBxWTd5bmFZbHdqSGVidmlWY3FtWXBwNzBKCnI3MlovOUlKdFp1UGU3bEIrR2xoU2cxTng3cjNhOG5vZmJlOFpHNXFZVGhTNzB1anVxYnQ4Ti91VU95K3JCR0sKaGI0ZWxKbi91V2ZWZTJ6TFBobStoWk5xcGNlcmJPSmxGZ2t6dW96TW9RS0JnUUQwTDZhK04vQ09rdXZKcldocAp4V2YwckVvS25UYUR5Rmo0K1FlQzR6WitNWDJDTlBWT2M4OFg4ZDA3b0I0cWlvTHlwa0pKTWNZRFlFZVdWdHFFCkNzclVSalJGQUtQVHdpcVEvYS9lTHpFVzZub3l1NUI5RGtyRXU4VTEwN1l3WFNaZkxBTXRETlJCeVVtZ0lLUlAKaHFteXVqT3U0RGl3eXJlWW9aSUJnbWdhQXc9PQotLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tCg"
    },
    retries: {
        // Configure retry attempts for `cypress run`
        // Default is 0
        runMode: 2,
        // Configure retry attempts for `cypress open`
        // Default is 0
        openMode: 0
    }
});
