import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

interface FormErrors {
    incompleteFlexion: boolean;
    incompleteExtension: boolean;
    elbowDrift: boolean;
    torsoLean: boolean;
}

interface AnalyzeRequest {
    arm: "left" | "right";
    repNumber: number;
    errors: FormErrors;
}

const ERROR_DESCRIPTIONS: Record<keyof FormErrors, string> = {
    incompleteFlexion:   "not curling the arm high enough at the top",
    incompleteExtension: "not fully extending the arm at the bottom",
    elbowDrift:          "letting the elbow drift forward instead of keeping it pinned to the side",
    torsoLean:           "leaning the torso back to swing the weight up",
};

export async function POST(req: Request) {
    try {
        const body: AnalyzeRequest = await req.json();
        const { arm, repNumber, errors } = body;

        const activeErrors = (Object.keys(errors) as (keyof FormErrors)[])
            .filter((key) => errors[key])
            .map((key) => ERROR_DESCRIPTIONS[key]);

        if (activeErrors.length === 0) {
            return Response.json({ feedback: "Perfect rep! Great form, keep it up!" });
        }

        const errorSummary = activeErrors.join("; ");

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a personal trainer giving real-time voice coaching during a bicep curl workout. " +
                        "Respond with exactly one or two short sentences of direct, actionable correction. " +
                        "Use second person. No markdown, no lists — plain spoken language only, " +
                        "since your response will be read aloud immediately.",
                },
                {
                    role: "user",
                    content:
                        `Rep ${repNumber} on the ${arm} arm just finished with these form issues: ${errorSummary}. ` +
                        "Give a brief coaching correction cue.",
                },
            ],
            max_tokens: 80,
            temperature: 0.6,
        });

        const feedback =
            completion.choices[0]?.message?.content?.trim() ?? "Focus on your form!";

        console.log(`[Analyze] Rep ${repNumber} (${arm}) feedback:`, feedback);
        return Response.json({ feedback });
    } catch (error) {
        console.error("[Analyze] Error:", error);
        return Response.json({ feedback: "Keep going, focus on your form!" }, { status: 500 });
    }
}
