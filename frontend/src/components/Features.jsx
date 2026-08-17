function Features() {
  const features = [
    {
      title: "Upload PDFs",
      description: "Store all your study material."
    },
    {
      title: "AI Flashcards",
      description: "Generate flashcards instantly."
    },
    {
      title: "AI Quizzes",
      description: "Practice using AI generated quizzes."
    }
  ];

  return (
    <section className="max-w-6xl mx-auto py-20">

      <h2 className="text-4xl font-bold text-center mb-10">
        Features
      </h2>

      <div className="grid md:grid-cols-3 gap-8">

        {features.map((feature) => (
          <div
            key={feature.title}
            className="border rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-xl font-semibold">
              {feature.title}
            </h3>

            <p className="text-gray-600 mt-2">
              {feature.description}
            </p>
          </div>
        ))}

      </div>

    </section>
  );
}

export default Features;