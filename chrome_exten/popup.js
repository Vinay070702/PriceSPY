
const scrapeUrl = document.getElementById('scrapeUrl');

scrapeUrl.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async () => {
      const html = document.documentElement.innerHTML;
      const soup = new DOMParser().parseFromString(html, 'text/html');
      const reviewSection = soup.querySelector('#reviews-medley-footer');
      const reviewLinks = reviewSection.querySelectorAll('a');
      // Get all the span elements with class="a-size-base"
      const spans = soup.querySelectorAll('span.a-size-base');

      // Loop through the spans and extract the percentages using a regular expression
      const percentages = [];
      for (let i = 0; i < spans.length; i++) {
        const span = spans[i];
        const text = span.textContent.trim();
        const match = text.match(/(\d+)%/);
        if (match) {
          const percentage = match[1];
          percentages.push(percentage);
        }
      }
      let reviews = [];
      let promises = [];
      for (let i = 0; i < reviewLinks.length; i++) {
        const href = reviewLinks[i].getAttribute('href');
        const url = href.startsWith('http') ? href : `https://www.amazon.in${href}`;
        for (let j = 1; j < 30; j++) 
        {
          const newUrl = `${url}&pageNumber=${j}`;
          const promise = fetch(newUrl)
            .then(response => response.text())
            .then(html => {
              const soup = new DOMParser().parseFromString(html, 'text/html');
              const reviewElements = soup.querySelectorAll('span.review-text-content span');
              for (let k = 0; k < reviewElements.length; k++) {
                const review = reviewElements[k].innerText;
                reviews.push(review);
              }
            });
          promises.push(promise);
        }
      }
      // wait for all the fetch requests to finish
      await Promise.all(promises);

      // send reviews to Flask URL
      const response = await fetch('http://127.0.0.1:5000/sentiment_analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reviews: reviews })
      });
      // parse sentiment analysis results from response and display as alert
      const result = await response.json();
      alert(JSON.stringify(result));
      alert(percentages);
    },
  });
});
