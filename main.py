import string
from flask import Flask, request, jsonify
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
import re
import string
from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer
from flask_cors import CORS

nltk.download('vader_lexicon')
sentiments = SentimentIntensityAnalyzer()
app = Flask(__name__)
CORS(app)  # add this line to enable CORS for all routes

def clean_review(text):
    # Convert to lowercase
    text = text.lower()
    # Remove URLs
    text = re.sub(r"http\S+", "", text)
    # Remove HTML tags
    text = re.sub(r"<.*?>", "", text)
    # Remove punctuation, except for exclamation points and question marks
    exclude = set(string.punctuation) - set(["!", "?"])
    text = "".join(ch for ch in text if ch not in exclude)
    # Remove numbers
    text = re.sub(r"\d+", "", text)
    # Remove stopwords and perform stemming
    stop_words = set(stopwords.words("english"))
    stemmer = SnowballStemmer("english")
    text = " ".join(stemmer.stem(word) for word in text.split() if word not in stop_words)
    return text

@app.route('/sentiment_analysis', methods=['POST'])
def sentiment_analysis():
    clean_rev=[]
    data = request.json
    reviews = data['reviews']
    for review in reviews:
        t1=clean_review(review)
        clean_rev.append(t1)
    scores = [sentiments.polarity_scores(review) for review in clean_rev]
    result = {
        'positive': sum(score['pos'] > score['neg'] for score in scores),
        'negative': sum(score['neg'] > score['pos'] for score in scores),
        'neutral': sum(score['pos'] == score['neg'] for score in scores)
    }
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
