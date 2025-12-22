# Security Requirement for Verification
## Entities pariticipating in this verification flow
- Email: sending from this server to the register inbox containing link with token
    - One link for both reject or verify email
    - [x] Or 2 links, one for reject, one for verify
- Token: uniqueness for each email registraton session, one email may have multiple token in case user have 
used the same email for registration in long period of time.
    - Token gen with uuid currently, check with DB for uniqueness
    - Generate 1 token mapping to 1 sso  -> I will used it as uuid primary for simple DB design
    - Tracking status YES or NO, expired date

- In case of verify, and server verify success, now come to the account creation sequence phase.