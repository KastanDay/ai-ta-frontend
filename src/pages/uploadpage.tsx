// React component
import React, { ChangeEvent } from 'react';
import axios from 'axios';

const UploadFile = () => {
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64File = reader.result;
      if (!base64File) return;

      void axios.post('/api/upload', {
        file: base64File,
        fileName: file.name,
        courseName: 'CS_101',
      }).then(response => {
        console.log(response.data);
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <input type="file" onChange={handleFileSelect} />
  );
};

export default UploadFile;
