# Video-Call

## To run this app on localhost
- run $ git clone repo name
- run $ npm install in /frontend and /backend
- run $ " openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem " in /backend/ssl of terminal to generate key.pem & cert.perm files (ignore quotes around ssl command)
- update const ipAdd in /backend/server.js with your local machine IP address
- update LOCAL_HOST ip address in frontend/next config file with your local machine IP address
- visit the server address with your machine via https://(place-your-ip-ipaddress-here)/(place-backend-port-here) once to approve permissions
- run $ npm run dev in /frontend and /backend
- viola ! 