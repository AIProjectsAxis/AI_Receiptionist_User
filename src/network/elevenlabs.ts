import axios from 'axios';

const BASE_URL = "https://api.elevenlabs.io/v1/voices?show_legacy=true";

export const fetchVoices = async () => {
    try {
        const response = await axios.get(BASE_URL);
        if (response?.data?.voices) {
            return response.data.voices;
        } else {
            console.error("Invalid response format:", response);
            return [];
        }
    } catch (error) {
        console.error("Error fetching voices:", error);
        return [];
    }
}; 