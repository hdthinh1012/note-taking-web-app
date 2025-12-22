# Security Requirement for Account Creation Link
After user approve the email, the server send a <will-defined-here> something for user to start the identification. Now the discussion is what should it be:
1. Just another link with token, exposed in the while, and based on the expiry to make security profile
2. Still a link with that token, but after open the link, browser - server work somehow for the browser to generate a http POST form with csrf token 