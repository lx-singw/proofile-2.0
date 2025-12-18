export class HunterAgent {
    static calculateMatch(jobDescription: string, userSkills: string[]): { score: number; reasoning: string } {
        if (!jobDescription || !userSkills.length) return { score: 0, reasoning: "Insufficient data" };

        const jobLower = jobDescription.toLowerCase();
        const matchedSkills = userSkills.filter(skill => jobLower.includes(skill.toLowerCase()));

        const score = Math.min(Math.round((matchedSkills.length / Math.max(userSkills.length, 5)) * 100), 95);

        return {
            score,
            reasoning: matchedSkills.length > 0
                ? `Matched ${matchedSkills.length} key skills: ${matchedSkills.slice(0, 3).join(", ")}`
                : "Low skill overlap detected."
        };
    }
}
