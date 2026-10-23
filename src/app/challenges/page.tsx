"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { authenticatedFetch } from "@/lib/api";

interface ChallengeResponse {
    id: number;
    gameCode: string;
    gameName: string;
    title: string;
    description: string;
    sponsorName: string;
    rewardDescription: string;
    targetMetric: string;
    targetValue: number;
    status: string;
    startsAt: string;
    endsAt: string;
}

interface ChallengeParticipationResponse {
    id: number;
    challengeId: number;
    title: string;
    gameCode: string;
    targetMetric: string;
    targetValue: number;
    progress: number;
    completed: boolean;
    joinedAt: string;
    completedAt: string | null;
}

export default function ChallengesPage() {
    const [challenges, setChallenges] =
        useState<ChallengeResponse[]>([]);

    const [participations, setParticipations] =
        useState<ChallengeParticipationResponse[]>([]);

    const [loading, setLoading] = useState(true);
    const [joiningChallengeId, setJoiningChallengeId] =
        useState<number | null>(null);

    const [error, setError] = useState("");

    const [statusCheckTime, setStatusCheckTime] = useState<number>(0);


    async function loadChallenges() {
        setLoading(true);
        setError("");
        setStatusCheckTime(Date.now());

        try {
            const [challengesResponse, myChallengesResponse] =
                await Promise.all([
                    authenticatedFetch(
                        "http://localhost:8080/api/challenges"
                    ),
                    authenticatedFetch(
                        "http://localhost:8080/api/challenges/me"
                    ),
                ]);

            if (!challengesResponse.ok) {
                throw new Error(
                    "Could not load challenges."
                );
            }

            if (!myChallengesResponse.ok) {
                throw new Error(
                    "Could not load your challenges."
                );
            }

            const challengesData =
                await challengesResponse.json();

            const myChallengesData =
                await myChallengesResponse.json();

            setChallenges(challengesData);
            setParticipations(myChallengesData);
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not load challenges."
            );
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        Promise.resolve().then(() => {
            void loadChallenges();
        });
    }, []);


    async function handleJoinChallenge(
        challengeId: number
    ) {
        setJoiningChallengeId(challengeId);
        setError("");

        try {
            const response = await authenticatedFetch(
                `http://localhost:8080/api/challenges/${challengeId}/join`,
                {
                    method: "POST",
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.message ??
                    "Could not join challenge."
                );
            }

            const participation =
                await response.json();

            setParticipations((current) => [
                ...current,
                participation,
            ]);
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not join challenge."
            );
        } finally {
            setJoiningChallengeId(null);
        }
    }

    function isJoined(challengeId: number) {
        return participations.some(
            (participation) =>
                participation.challengeId === challengeId
        );
    }

    function getParticipation(
        challengeId: number
    ) {
        return participations.find(
            (participation) =>
                participation.challengeId === challengeId
        );
    }

    function formatDate(value: string) {
        return new Date(value).toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    }

    function getProgressPercentage(
        participation:
            | ChallengeParticipationResponse
            | undefined
    ) {
        if (!participation) {
            return 0;
        }

        if (participation.targetValue <= 0) {
            return 0;
        }

        return Math.min(
            100,
            Math.round(
                (participation.progress /
                    participation.targetValue) *
                100
            )
        );
    }


    const completedChallenges = challenges.filter((challenge) => {
        const participation = getParticipation(challenge.id);

        return participation?.completed === true;
    });

    const activeChallenges = challenges.filter((challenge) => {
        const participation = getParticipation(challenge.id);

        if (participation?.completed) {
            return false;
        }

        const endTime = new Date(challenge.endsAt).getTime();

        return (
            challenge.status === "ACTIVE" &&
            statusCheckTime <= endTime
        );
    });

    const endedChallenges = challenges.filter((challenge) => {
        const participation = getParticipation(challenge.id);

        if (participation?.completed) {
            return false;
        }

        const endTime = new Date(challenge.endsAt).getTime();

        return (
            challenge.status !== "ACTIVE" ||
            statusCheckTime > endTime
        );
    });

    const challengeSections = [
        {
            title: "Active Challenges",
            challenges: activeChallenges,
        },
        {
            title: "Completed Challenges",
            challenges: completedChallenges,
        },
        {
            title: "Ended Challenges",
            challenges: endedChallenges,
        },
    ].filter((section) => section.challenges.length > 0);

    return (
        <AppShell title="Challenges">
            <div className="challenges-page">
                <div className="challenges-header">
                    <div>
            <span className="page-eyebrow">
              COMPETITION
            </span>

                        <h1>Challenges</h1>

                        <p>
                            Join sponsored challenges, track
                            your progress and earn rewards.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="page-error">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="challenges-empty">
                        Loading challenges...
                    </div>
                ) : challenges.length === 0 ? (
                    <div className="challenges-empty">
                        <h3>No active challenges</h3>

                        <p>
                            There are currently no challenges
                            available.
                        </p>
                    </div>
                ) : (

                    <div className="challenges-sections">
                        {challengeSections.map((section) => (
                            <section
                                key={section.title}
                                style={{ marginBottom: "36px" }}
                            >
                                <h2
                                    style={{
                                        fontSize: "22px",
                                        fontWeight: 700,
                                        color: "#f8fafc",
                                        marginBottom: "20px",
                                    }}
                                >
                                    {section.title}
                                </h2>

                                <div className="challenges-grid">
                                    {section.challenges.map((challenge) => {

                                        const joined = isJoined(
                                challenge.id
                            );

                            const participation =
                                getParticipation(challenge.id);

                            const progress =
                                getProgressPercentage(
                                    participation
                                );


                            const now = statusCheckTime;

                            const startTime = new Date(challenge.startsAt).getTime();
                            const endTime = new Date(challenge.endsAt).getTime();

                            const isUpcoming =
                                challenge.status === "ACTIVE" && now < startTime;

                            const isEnded =
                                challenge.status === "ACTIVE" && now > endTime;

                            const hasEnded =
                                isEnded || challenge.status === "ENDED";

                            const isJoinable =
                                challenge.status === "ACTIVE" &&
                                !isUpcoming &&
                                !isEnded;

                                        const displayStatus = participation?.completed
                                            ? "COMPLETED"
                                            : isEnded
                                                ? "ENDED"
                                                : isUpcoming
                                                    ? "UPCOMING"
                                                    : challenge.status;


                            return (
                                <article
                                    className="challenge-card"
                                    key={challenge.id}
                                >
                                    <div className="challenge-card-top">
                                        <div>
                      <span className="challenge-game">
                        {challenge.gameName}
                      </span>

                                            <h2>
                                                {challenge.title}
                                            </h2>
                                        </div>


                                        <span
                                            className={`challenge-status ${
                                                participation?.completed
                                                    ? "challenge-status-completed"
                                                    : isEnded
                                                        ? "challenge-status-ended"
                                                        : ""
                                            }`}
                                        >
    {displayStatus}
</span>

                                    </div>

                                    <p className="challenge-description">
                                        {challenge.description}
                                    </p>

                                    <div className="challenge-sponsor">
                                        <span>SPONSORED BY</span>
                                        <strong>
                                            {challenge.sponsorName}
                                        </strong>
                                    </div>

                                    <div className="challenge-info-grid">
                                        <div>
                                            <span>Objective</span>

                                            <strong>
                                                {challenge.targetValue}{" "}
                                                {challenge.targetMetric}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Reward</span>

                                            <strong>
                                                {
                                                    challenge.rewardDescription
                                                }
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="challenge-dates">
                    <span>
                      {formatDate(
                          challenge.startsAt
                      )}
                    </span>

                                        <span>→</span>

                                        <span>
                      {formatDate(
                          challenge.endsAt
                      )}
                    </span>
                                    </div>

                                    {joined && participation && (
                                        <div className="challenge-progress">
                                            <div className="challenge-progress-header">
                                                <span>Your progress</span>

                                                <strong>
                                                    {participation.progress} /{" "}
                                                    {
                                                        participation.targetValue
                                                    }
                                                </strong>
                                            </div>

                                            <div className="challenge-progress-track">
                                                <div
                                                    className="challenge-progress-bar"
                                                    style={{
                                                        width: `${progress}%`,
                                                    }}
                                                />
                                            </div>

                                            <span className="challenge-progress-percent">
                        {progress}% completed
                      </span>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className={
                                            joined
                                                ? "challenge-join-button joined"
                                                : "challenge-join-button"
                                        }
                                        disabled={
                                            joined ||
                                            joiningChallengeId === challenge.id ||
                                            !isJoinable
                                        }
                                        onClick={() =>
                                            handleJoinChallenge(
                                                challenge.id
                                            )
                                        }
                                    >

                                        {joined
                                            ? participation?.completed
                                                ? "Completed"
                                                : hasEnded
                                                    ? "Challenge Ended"
                                                    : "Joined"
                                            : joiningChallengeId === challenge.id
                                                ? "Joining..."
                                                : hasEnded
                                                    ? "Challenge Ended"
                                                    : isUpcoming
                                                        ? "Coming Soon"
                                                        : !isJoinable
                                                            ? "Unavailable"
                                                            : "Join Challenge"}

                                    </button>
                                </article>
                                    );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                )}

            </div>
        </AppShell>
    );
}