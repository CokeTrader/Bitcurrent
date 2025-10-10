# BitCurrent Exchange - FCA Compliance Framework

**Document Type**: Compliance Manual  
**Version**: 1.0  
**Date**: October 10, 2025  
**Review Frequency**: Quarterly

---

## 1. Regulatory Overview

### 1.1 Registration Status
- **FCA Registration Number**: [Pending/To be assigned]
- **Registration Type**: Cryptoasset Business
- **Status**: Application in progress
- **Submission Date**: [Date]
- **Expected Approval**: [Date]

### 1.2 Regulatory Framework
BitCurrent operates under:
- Financial Services and Markets Act 2000
- Money Laundering, Terrorist Financing and Transfer of Funds (Information on the Payer) Regulations 2017
- UK General Data Protection Regulation (UK GDPR)
- Payment Services Regulations 2017
- Electronic Money Regulations 2011 (if applicable)

---

## 2. Anti-Money Laundering (AML) Framework

### 2.1 Risk Assessment

**Inherent Risks**:
- Customer risk: Varied (retail to institutional)
- Product risk: Medium-High (cryptocurrencies)
- Geographic risk: Low (UK-focused)
- Delivery channel risk: Medium (online platform)

**Mitigating Controls**:
- Robust KYC procedures
- Transaction monitoring
- Sanctions screening
- Enhanced due diligence for high-risk customers

### 2.2 Customer Due Diligence (CDD)

**Tier 1 - Basic Verification** (Limits: £1,000/day):
- Full name, date of birth
- Residential address
- Email and phone verification
- Automated ID verification (Onfido)

**Tier 2 - Enhanced Verification** (Limits: £50,000/day):
- Government-issued ID (passport/driving licence)
- Proof of address (utility bill, bank statement <3 months)
- Selfie verification
- Source of funds declaration

**Tier 3 - Premium Verification** (Unlimited):
- Enhanced due diligence
- Source of wealth documentation
- Purpose of account
- Expected transaction volumes
- Senior management approval required

### 2.3 Ongoing Monitoring

**Transaction Monitoring Rules**:
- Large transactions: >£10,000 flagged for review
- Rapid transactions: >5 in 1 hour flagged
- Unusual patterns: Deviations from baseline
- Structuring: Multiple transactions just below thresholds

**Screening**:
- PEP (Politically Exposed Persons) screening via ComplyAdvantage
- Sanctions list checking (OFAC, UN, EU, UK)
- Adverse media screening
- Real-time transaction screening via Chainalysis

### 2.4 Suspicious Activity Reporting (SAR)

**Indicators**:
- Transactions with no apparent economic purpose
- Customer reluctant to provide information
- Unusual transaction patterns
- Transactions to/from high-risk jurisdictions

**Process**:
1. Compliance officer reviews flagged activity
2. Additional information requested from customer
3. If suspicious, file SAR with NCA
4. Continue monitoring (no tipping off)
5. Maintain confidentiality

**Reporting Timeline**: Within 24 hours of knowledge/suspicion

---

## 3. Know Your Customer (KYC) Procedures

### 3.1 Identity Verification

**Automated Verification** (Onfido):
- Document authenticity check
- Biometric facial verification
- Data extraction and validation
- Real-time decision (approve/reject/review)

**Manual Review**:
- Complex cases
- Failed automated checks
- Enhanced due diligence
- Compliance officer approval

### 3.2 Verification Documents

**Acceptable ID**:
- UK/EU passport
- UK driving licence (photocard)
- National identity card (EU)

**Proof of Address** (<3 months old):
- Utility bill
- Bank statement
- Council tax bill
- Government letter

### 3.3 Rejection Criteria

Reject if:
- Document expired or invalid
- Poor quality images
- Mismatch between documents
- Suspected fraud
- Sanctioned individual
- PEP without enhanced DD

### 3.4 Record Keeping

Retention: 7 years from account closure  
Storage: Encrypted S3 bucket (eu-west-2)  
Access: Compliance team only

---

## 4. Client Money Protection

### 4.1 Safeguarding

**Requirements**:
- Client GBP held in segregated safeguarding account
- Daily reconciliation
- Third-party custodian for cryptocurrency
- Client money clearly identified

**Safeguarding Account**:
- Bank: ClearBank Ltd (FCA authorized)
- Account Type: Safeguarding Account
- Daily balance reporting

### 4.2 Reconciliation

**Daily Process**:
1. Calculate total client balances (database)
2. Verify bank account balance
3. Verify cryptocurrency holdings (on-chain)
4. Identify and resolve discrepancies
5. Report to senior management
6. Maintain reconciliation records

**Tolerance**: ±0.01% (flag for investigation)

### 4.3 Proof of Reserves

**Monthly Publication**:
- Merkle root published to Ethereum blockchain
- Full report on website
- Third-party attestation (quarterly)
- Transparency dashboard

---

## 5. Data Protection (UK GDPR)

### 5.1 Lawful Processing

**Legal Bases**:
- Contract: Account management, transaction processing
- Legal obligation: KYC/AML, regulatory reporting
- Legitimate interests: Fraud prevention, service improvement
- Consent: Marketing communications

### 5.2 Data Minimization

We collect only data necessary for:
- Account creation
- Identity verification
- Transaction processing
- Regulatory compliance

### 5.3 Data Subject Rights

**Procedures**:
- Access requests: Respond within 30 days
- Rectification: Update within 5 business days
- Erasure: Subject to 7-year retention requirement
- Portability: Provide data in CSV/JSON format

### 5.4 Data Protection Impact Assessment (DPIA)

Completed for:
- KYC document processing
- Transaction monitoring
- Blockchain analytics
- Automated decision-making

---

## 6. Financial Crime Prevention

### 6.1 Risk-Based Approach

**Customer Risk Factors**:
- High risk: PEPs, high-net-worth, complex structures
- Medium risk: Standard retail customers
- Low risk: Verified long-term customers with regular patterns

**Transaction Risk Factors**:
- High risk: Large amounts, unusual patterns, high-risk jurisdictions
- Medium risk: First-time large transactions
- Low risk: Regular trading patterns

### 6.2 Enhanced Due Diligence (EDD)

Required for:
- PEPs and family members
- Transactions >£25,000
- High-risk jurisdictions
- Unusual transaction patterns

**EDD Measures**:
- Senior management approval
- Enhanced background checks
- Source of wealth documentation
- Ongoing monitoring (monthly reviews)

### 6.3 Sanctions Compliance

**Screening Against**:
- UK HM Treasury sanctions list
- UN sanctions list
- EU sanctions list (post-Brexit retained)
- OFAC sanctions list (US)

**Frequency**:
- Real-time: Every transaction
- Daily: All customer records
- On update: When sanctions lists updated

---

## 7. Record Keeping

### 7.1 Records Maintained

**Customer Records**:
- KYC documentation
- Verification decisions and rationale
- Risk assessments
- Communication logs

**Transaction Records**:
- All deposits and withdrawals
- All trades
- Fees charged
- Timestamps and IP addresses

**Compliance Records**:
- Training records
- Policy reviews
- Audit reports
- Regulatory correspondence

### 7.2 Retention Period

**Minimum**: 7 years from transaction/closure  
**Storage**: Encrypted, access-controlled  
**Backup**: Redundant, geographically distributed

---

## 8. Governance and Oversight

### 8.1 Compliance Structure

```
Board of Directors
    ↓
CEO
    ↓
├─→ MLRO (Money Laundering Reporting Officer)
│   └─→ Compliance Team
├─→ DPO (Data Protection Officer)
├─→ CISO (Chief Information Security Officer)
└─→ CFO (Financial oversight)
```

### 8.2 Responsibilities

**MLRO**:
- AML/CTF compliance
- SAR filing
- Staff training
- Policy updates
- Regulatory liaison

**DPO**:
- GDPR compliance
- Data subject requests
- Privacy impact assessments
- Data breach response

**CISO**:
- Information security
- Cybersecurity
- Incident response

### 8.3 Training

**Frequency**: Annually (minimum)  
**Content**:
- AML/CTF regulations
- KYC procedures
- Data protection
- Financial crime typologies
- Sanctions compliance

**Certification**: All staff must pass compliance training

---

## 9. Reporting and Monitoring

### 9.1 Internal Reporting

**Monthly Reports**:
- New account registrations
- KYC approval/rejection rates
- Transaction volumes and values
- Flagged transactions
- SAR filings

**Quarterly Reports**:
- Compliance risk assessment
- Policy effectiveness review
- Training completion rates
- Audit findings and remediation

**Annual Reports**:
- Comprehensive compliance review
- Regulatory change impact assessment
- Budget and resource planning

### 9.2 Regulatory Reporting

**To FCA** (as required):
- Annual compliance report
- Material changes to business
- Significant incidents
- Suspicious activity (via NCA)

**To HMRC**:
- Customer information (if requested)
- Suspicious activity

**To NCA**:
- Suspicious Activity Reports (SARs)

---

## 10. Compliance Calendar

### Daily:
- ✅ Transaction monitoring review
- ✅ Sanctions screening
- ✅ Client money reconciliation

### Weekly:
- ✅ Flagged transaction review
- ✅ KYC application processing
- ✅ Customer communication review

### Monthly:
- ✅ Compliance metrics report
- ✅ Policy review
- ✅ Wallet reconciliation
- ✅ Proof of reserves publication

### Quarterly:
- ✅ Risk assessment update
- ✅ Board compliance report
- ✅ Third-party audit (reserves)
- ✅ Staff training

### Annually:
- ✅ Full compliance audit
- ✅ Policy comprehensive review
- ✅ Regulatory permissions renewal
- ✅ Insurance renewal

---

## 11. Incident Response

### 11.1 Security Incidents

**Response Plan**:
1. Detect and contain
2. Assess impact
3. Notify affected parties (72 hours)
4. Notify ICO (if GDPR breach)
5. Remediate and document
6. Review and improve

### 11.2 Compliance Breaches

**Response**:
1. Identify breach
2. Document circumstances
3. Implement remediation
4. Report to FCA (if material)
5. Update procedures
6. Staff retraining

---

## 12. Third-Party Risk Management

### 12.1 Due Diligence

Before engaging service providers:
- Financial stability check
- Regulatory compliance review
- Security assessment
- Data protection evaluation
- Contract negotiation

### 12.2 Ongoing Monitoring

- Annual reviews
- Performance monitoring
- Security audits
- Compliance verification

### 12.3 Key Service Providers

| Provider | Service | Risk Level | Review Frequency |
|----------|---------|------------|------------------|
| Onfido | KYC | High | Quarterly |
| Chainalysis | AML | High | Quarterly |
| ClearBank | Banking | High | Quarterly |
| AWS | Infrastructure | Medium | Annually |
| Fireblocks | Custody | High | Quarterly |

---

## 13. Audit and Review

### 13.1 Internal Audit

**Frequency**: Quarterly  
**Scope**:
- KYC procedures
- Transaction monitoring
- Record keeping
- System security
- Policy adherence

### 13.2 External Audit

**Frequency**: Annually  
**Auditor**: Big 4 firm (Deloitte, PwC, KPMG, EY)  
**Scope**:
- Financial statements
- Client money safeguarding
- Compliance with regulations
- Proof of reserves

### 13.3 Penetration Testing

**Frequency**: Annually (minimum)  
**Provider**: Specialized security firm  
**Scope**:
- Application security
- Infrastructure security
- Social engineering
- Physical security

---

## 14. Contact Information

**Money Laundering Reporting Officer (MLRO)**:  
Email: mlro@bitcurrent.co.uk

**Data Protection Officer (DPO)**:  
Email: dpo@bitcurrent.co.uk

**Compliance Team**:  
Email: compliance@bitcurrent.co.uk

**FCA Liaison**:  
Email: regulatory@bitcurrent.co.uk

---

**Document Control**:
- Owner: Chief Compliance Officer
- Review Date: January 10, 2026
- Next Review: Quarterly
- Approval: Board of Directors

---

*This compliance framework must be reviewed and approved by the MLRO and legal counsel. It should be tailored to actual FCA registration requirements and kept updated with regulatory changes.*



