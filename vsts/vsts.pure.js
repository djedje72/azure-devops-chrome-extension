export const getToApprovePullRequests = (currentMember, pullRequests) => {
    if(pullRequests.length > 0 && currentMember) {
        let toApprovePullRequests = pullRequests.filter((pullRequest) => {
            if(pullRequest.reviewers && pullRequest.createdBy.uniqueName !== currentMember.uniqueName) {
                let teamPullRequest = pullRequest.reviewers.filter((reviewer) => {
                    return currentMember.teams.includes(reviewer.id);
                });
                let mineReview = pullRequest.reviewers.filter((reviewer) => {
                    return reviewer.uniqueName === currentMember.uniqueName;
                });
                const approved = (vote) => vote > 0;
                let approves = mineReview.filter((reviewer) => {
                    return approved(reviewer.vote);
                });
                let denies = mineReview.filter((reviewer) => {
                    return !approved(reviewer.vote);
                });

                if (denies.length > 0 || approves.length === 0 &&  teamPullRequest.length > 0) {
                    return true;
                }
            }
            return false;
        });
        return toApprovePullRequests;
    }
};