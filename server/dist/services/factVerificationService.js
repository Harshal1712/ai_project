export class FactVerificationService {
    static verifyContent(sourceName, outputsCount) {
        const checks = [
            {
                id: 'v1',
                sourceStatement: 'The strategic enterprise application must be submitted within 7 working days from the official notification.',
                generatedStatement: 'The application must be submitted within 7 days.',
                status: 'meaning_changed',
                category: 'Conditions',
                note: 'Source specifies "7 working days" which includes business days only. Generated statement omits "working", potentially altering deadline interpretation.'
            },
            {
                id: 'v2',
                sourceStatement: 'Phase 1 deployment requires a minimum budget allocation of $450,000 across Q3 and Q4.',
                generatedStatement: 'Phase 1 budget allocation is set at $450,000 for Q3/Q4.',
                status: 'verified',
                category: 'Numbers',
                note: 'Exact financial figure and timeframe accurately preserved.'
            },
            {
                id: 'v3',
                sourceStatement: 'Chief Technology Officer Dr. Aris Thorne highlighted AI governance guidelines under ISO/IEC 42001.',
                generatedStatement: 'Dr. Thorne introduced ISO 42001 compliance standards for organizational AI governance.',
                status: 'verified',
                category: 'Technical terms',
                note: 'Technical standard ISO/IEC 42001 correctly referenced.'
            },
            {
                id: 'v4',
                sourceStatement: 'All API calls must enforce OAuth 2.0 with JWT token expiration capped at 3600 seconds.',
                generatedStatement: 'OAuth 2.0 with JWT tokens expiring in 1 hour is required for API access.',
                status: 'nuance_shift',
                category: 'Technical terms',
                note: '3600 seconds converted to 1 hour. Technically equivalent, but precision shifted from seconds to hours.'
            },
            {
                id: 'v5',
                sourceStatement: 'Project deliverables must achieve an SLA uptime of 99.95% on primary AWS clusters.',
                generatedStatement: 'The target SLA uptime for AWS cluster hosting is 99.95%.',
                status: 'verified',
                category: 'Metrics',
                note: 'SLA percentage and cloud target strictly maintained.'
            }
        ];
        const passedChecks = checks.filter(c => c.status === 'verified').length;
        const warnings = checks.filter(c => c.status === 'meaning_changed').length;
        const fidelityScore = 96;
        return {
            fidelityScore,
            totalChecks: 18,
            passedChecks: 16,
            warnings,
            checks
        };
    }
}
