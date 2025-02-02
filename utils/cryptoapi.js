import { XRapidAPIHost, XRapidAPIKey, XRapidAPIHostNews } from "./api";
import axios from "axios";

const apiBaseUrl = "https://api.coinranking.com/v2";
const newsUrl = "https://kenyan-news-api.p.rapidapi.com/news/English";



const NewsApiCall = async (endpoints) => {
  const options = {
    method: "GET",
    url: endpoints,
    headers: {
      "X-RapidAPI-Key": XRapidAPIKey,
      "X-RapidAPI-Host": XRapidAPIHostNews,
    },
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error("NewsApiCall Error:", error.message);
    return {};
  }
};

export const FetchKenyanNews = async () => {
  return await NewsApiCall(newsUrl);
};
