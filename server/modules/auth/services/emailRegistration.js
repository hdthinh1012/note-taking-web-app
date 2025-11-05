class EmailRegistrationService {
    static async verifyUuid(process, uuid) {
        return new Promise((resolve, reject) => {
            // const ssoEntry = await ssoRepository.getSsoEntryByUuid(uuid);
            // if (!ssoEntry) {
            //   return res.status(404).json({ error: 'SSO entry not found' });
            // }
            // const { sso_account, verified } = ssoEntry;
            // if (verified) {
            //   return res.status(400).json({ error: 'User already verified' });
            // }
            // let otherSsoEntries = await ssoRepository.getSsosByAccount(sso_account);

            const criticalSection = async (message) => {
                if (message === 'lock-acquired') {
                    console.log('Lock acquired in worker', process.pid);
                    setTimeout(() => {
                        process.send('release-lock');
                        process.removeListener('message', criticalSection);
                        resolve();
                    }, 10000);

                    // Simulate some processing delay
                    // if (otherSsoEntries.length > 1) {
                    //   otherSsoEntries = otherSsoEntries.filter(entry => entry.uuid !== uuid);
                    //   ssoRepository.markSsoAsInvalid(otherSsoEntries.map(entry => entry.uuid));
                    // }
                    // await ssoRepository.markSsoAsVerified(uuid);

                    // process.send('release-lock');
                    /**
                     * End of critical section
                     */
                }
            }

            /**
             * Start of critical section
             */
            process.send('acquire-lock');
            process.on('message', criticalSection);
        });
    }
}

module.exports = { EmailRegistrationService };