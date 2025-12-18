export class NetworkAgent {
    static getConnectionContext(myIndustry: string, theirIndustry: string): string {
        if (!myIndustry || !theirIndustry) return "Expand your professional network.";

        if (myIndustry === theirIndustry) {
            return `You both work in ${myIndustry}. Great for knowledge sharing.`;
        }

        return `Diversify your network with insights from ${theirIndustry}.`;
    }
}
