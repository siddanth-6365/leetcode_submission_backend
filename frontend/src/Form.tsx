import React, { useState } from 'react';
import axios from 'axios';

const SubmitForm: React.FC = () => {
  const [problemId, setProblemId] = useState('');
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      problemId,
      userId,
      code,
      language,
    };
  
    try {
      const response = await axios.post('http://localhost:8080/submit', formData);
      const result = await response.data.json(); // get the websocket url from the server
      if (result.status === 'success') {
        const ws = new WebSocket(result.wsUrl);

        ws.onmessage = function (event) {
          const response = JSON.parse(event.data);
          console.log('Received response:', response);
        };
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Problem ID:</label>
        <input
          type="text"
          value={problemId}
          onChange={(e) => setProblemId(e.target.value)}
        />
      </div>
      <div>
        <label>User ID:</label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </div>
      <div>
        <label>Code:</label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <div>
        <label>Language:</label>
        <input
          type="text"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        />
      </div>
      <button type="submit">Submit</button>
    </form>
  );
};

export default SubmitForm;
