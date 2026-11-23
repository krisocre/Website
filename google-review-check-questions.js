(function (root) {
  const questions = {
    experience: { prompt: 'Does the review describe a service or location your business never offered?', policy: 'fake' },
    connection: { prompt: 'Can you document a connection to a competitor, employee or former employee?', policy: 'conflict' },
    duplicates: { prompt: 'Can you show matching reviews posted by different accounts?', policy: 'fake' },
    incentive: { prompt: 'Do you have evidence that someone offered payment or another incentive to post the review?', policy: 'fake' },
    demand: { prompt: 'Did someone demand money or a favour to take the review down?', policy: 'extortion' },
    private: { prompt: 'Does the review disclose someone’s private information without permission?', policy: 'privacy' },
    threat: { prompt: 'Does the review or related message contain a specific threat?', policy: 'harassment' }
  };
  root.ReviewRemovalCheckQuestions = Object.freeze(questions);
})(globalThis);
