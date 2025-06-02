# Use an official Node.js runtime as a parent image
# We use 'slim' for a smaller image size.
# The Node version should ideally match or be compatible with your package.json engines.
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if you have one)
# This step is separate to leverage Docker's layer caching.
# If package.json hasn't changed, this layer won't be rebuilt.
COPY package*.json ./

# Install app dependencies
# Using --only=production can reduce image size if you have devDependencies,
# but for this simple server, it's likely not a huge difference.
RUN npm install

# Bundle app source
# This copies server.js, the 'public' directory (which you need to create
# and move your index.html, script.js, index.css into),
# and any other files from your project root.
COPY . .

# Your server.js is set to listen on the port specified by
# the PORT environment variable, which Cloud Run provides.
# So, an EXPOSE instruction is not strictly necessary for Cloud Run,
# but can be good for documentation or local testing.
# EXPOSE 8080

# Define the command to run your app using npm start (which runs server.js)
CMD [ "npm", "start" ]
