# Access Control
## AC-07 - UNSUCCESSFUL LOGIN ATTEMPTS

The information system:

a. Enforces a limit of five (5) consecutive invalid logon attempts by a user during a 120-minute time period; and

For all two-factor authentications using a PIV card, configure the maximum allowable login attempts as specified by the type of card and trusting certificate. The maximum allowed PIN attempts for each PIV card stock is specified below:
     • Fifteen (15) attempts – for 64k card stock in either Cybertrust / Verizon Business CA or those converted to Entrust     certificates (64k card stock only); and
     •Ten (10) attempts – for modern 128k cards issued by the Entrust CA.]; and

b. When the maximum number of unsuccessful attempts is exceeded, automatically enforces the following: 
	Low - locks the account/node for 15 minutes.
    Moderate - locks the account/node for 15 minutes
    High - locks the account/node until released by an administrator.

Automatically [locks the account and delays the next logon prompt for 15 minutes or until released by an administrator] when the maximum number of unsuccessful attempts is exceeded.

Note: The maximum Personal Identification Number (PIN) attempts allowed for PIV cards is specified by policies implemented within the Smart Card Management System (SCMS) during issuance. These policies vary depending on a combination of card stock (64k, 128k), and certificate issuer for HHS (Cybertrust/Verizon Business CA or Entrust) and type of credential (PIV, RLA, ALT)

### OPS Implementation

TODO: Is the time period or number of login attemps configurable on login.gov?  HHS may have different prescriptive values?  Is there any inheritence from login.gov ?

	

#### Related Files
a. Evidence of login attempts (examples - TODO: update these once determined.)
	1. 12:02![12-02-01](https://user-images.githubusercontent.com/77121362/112881489-5b383500-9091-11eb-96fc-841241ab2c29.png)
	2. 12:03![12-03-15](https://user-images.githubusercontent.com/77121362/112881526-668b6080-9091-11eb-9e6d-5ee040a80918.png)
	3. 12:04![12-04-33](https://user-images.githubusercontent.com/77121362/112881542-6d19d800-9091-11eb-94e2-7c0102a2c5de.png)
	4. 12:05![12-05-54](https://user-images.githubusercontent.com/77121362/112881578-799e3080-9091-11eb-8072-458c3614e146.png)
	5. 12:06![12-06-53](https://user-images.githubusercontent.com/77121362/112881591-7f941180-9091-11eb-9997-fd8e961df408.png)
b. Evidence of locked account![Account_Locked](https://user-images.githubusercontent.com/77121362/112881665-95093b80-9091-11eb-8383-fd9fc2f528c0.png)
c. Evidence of unlocked account![Account_Unlocked](https://user-images.githubusercontent.com/77121362/112881687-9c304980-9091-11eb-99a0-79e2e28764cc.png)
