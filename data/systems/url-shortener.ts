export const urlShortener = {
  id: "url-shortener",
  title: "URL Shortener",
  scenario: "It's 2019. You just joined a startup as the only engineer. Your CEO walks in Monday morning: 'We need a URL shortener like bit.ly by Friday. Expecting 10 million users at launch.' You have 3 days. Let's build it.",
  decisions: [
    {
      id: 1,
      question: "A user pastes a long URL. What does your system need to do?",
      context: "This is the foundation. Get this wrong and you build the wrong thing entirely.",
      options: [
        {
          id: "a",
          text: "Store it and generate a short code",
          correct: true,
          consequence: "Smart. Two functions — shorten and redirect. Let's build.",
          consequenceType: "success"
        },
        {
          id: "b",
          text: "Encrypt it for security",
          correct: false,
          consequence: "Encryption protects data, it doesn't shorten it. Users can't share an encrypted blob.",
          consequenceType: "failure"
        },
        {
          id: "c",
          text: "Compress the URL",
          correct: false,
          consequence: "Compression reduces file size, not URL length. https://amazon.in/very/long compressed is still ugly.",
          consequenceType: "failure"
        }
      ],
      learning: "Every system starts with its core functions. Shorten + redirect. Simple, but getting this wrong means building the wrong thing entirely."
    },
    {
      id: 2,
      question: "You need to generate a unique short code like bit.ly/x7k2p for every URL. How?",
      context: "Every URL needs a unique identifier. Choose wisely.",
      options: [
        {
          id: "a",
          text: "Random string every time",
          correct: false,
          consequence: "Random strings can collide — two URLs could get the same code. Your redirects are now broken.",
          consequenceType: "failure"
        },
        {
          id: "b",
          text: "Auto-increment ID converted to Base62",
          correct: true,
          consequence: "ID 1,000,000 becomes x7k2p. 56 billion unique codes with just 6 characters.",
          consequenceType: "success"
        },
        {
          id: "c",
          text: "Use the full URL as the key",
          correct: false,
          consequence: "bit.ly/https://amazon.in/very/long/product/page isn't exactly short, is it?",
          consequenceType: "failure"
        }
      ],
      learning: "Base62 uses a-z, A-Z, 0-9 — 62 characters. One auto-increment ID maps to one unique, short, URL-safe code. Forever."
    },
    {
      id: 3,
      question: "Launch day. 10 million users. Every redirect hits your database directly. Database CPU is at 100% and climbing. Users are seeing timeouts. What do you do?",
      context: "Your system is melting. You have 5 minutes to fix it.",
      options: [
        {
          id: "a",
          text: "Add more database servers",
          correct: false,
          consequence: "Helps a little — but you're still doing unnecessary work. The same 100 popular URLs are being looked up millions of times.",
          consequenceType: "failure"
        },
        {
          id: "b",
          text: "Add Redis cache in front of the DB",
          correct: true,
          consequence: "Popular URLs served from memory in microseconds. Database barely touched. CPU drops instantly.",
          consequenceType: "success"
        },
        {
          id: "c",
          text: "Limit users to reduce load",
          correct: false,
          consequence: "Your CEO just called. You're fired.",
          consequenceType: "failure"
        }
      ],
      learning: "A URL shortener is read-heavy — redirects happen millions of times more than creates. Caching popular URLs means your database only handles cold lookups. Redis saves your launch."
    },
    {
      id: 4,
      question: "A celebrity tweets your short link. 500,000 simultaneous clicks in 60 seconds. Your single app server is overwhelmed. What do you add?",
      context: "One server has a ceiling. You've hit it.",
      options: [
        {
          id: "a",
          text: "Make the app server faster",
          correct: false,
          consequence: "Optimizing one server has limits. You can't make one machine handle 500k simultaneous connections.",
          consequenceType: "failure"
        },
        {
          id: "b",
          text: "Add a Load Balancer + multiple app servers",
          correct: true,
          consequence: "Traffic distributed evenly across 10 servers. Each handles 50k requests. Smooth.",
          consequenceType: "success"
        },
        {
          id: "c",
          text: "Ask the celebrity to delete the tweet",
          correct: false,
          consequence: "Bold strategy. Didn't work. They have 30 million followers.",
          consequenceType: "failure"
        }
      ],
      learning: "One server always has a ceiling. A load balancer distributes traffic across many servers — horizontal scaling means you just add more servers when traffic grows."
    },
    {
      id: 5,
      question: "You're storing billions of URL mappings. Your SQL database is struggling with the volume. What do you switch to?",
      context: "Billions of rows. Simple key-value lookups. SQL is groaning.",
      options: [
        {
          id: "a",
          text: "Keep SQL, add more indexes",
          correct: false,
          consequence: "Indexes help, but SQL wasn't built for billions of simple key-value lookups at this scale. You're fighting the tool.",
          consequenceType: "failure"
        },
        {
          id: "b",
          text: "Switch to NoSQL (DynamoDB/Cassandra)",
          correct: true,
          consequence: "Simple key-value data, no complex joins needed, horizontal scaling built-in. Billions of rows? No problem.",
          consequenceType: "success"
        },
        {
          id: "c",
          text: "Store everything in memory",
          correct: false,
          consequence: "Billions of URLs × 100 bytes = terabytes of RAM needed. Your AWS bill just killed the startup.",
          consequenceType: "failure"
        }
      ],
      learning: "NoSQL wins here because the data is simple — short code maps to long URL. No relationships, no joins. Just fast key-value lookups at massive scale."
    }
  ],
  finalArchitecture: "User → Load Balancer → App Servers → Redis Cache → NoSQL DB",
  score: {
    perfect: "You kept the startup alive 🚀",
    good: "Solid engineer. A few rough edges.",
    average: "The system survived. Barely.",
    poor: "The CEO is not happy."
  }
}
