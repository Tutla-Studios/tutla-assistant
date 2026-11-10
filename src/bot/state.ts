type TutlaState = {
    afkUsers: Record<any, string>
    /** Question of the day shown by /qotd. */
    qotd: string
}

export const state: TutlaState = {
    afkUsers: {},
    qotd: '',
}
