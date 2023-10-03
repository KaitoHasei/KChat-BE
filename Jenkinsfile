pipeline {
    agent any

    stages {
        stage('Packaging/Pushing image') {
            steps {
                withDockerRegistry(credentialsId: 'docker-hub',  uri: 'https://index.docker.io/v1/') {
                    sh 'docker build -t kaitohasei/kchat-backend-dev -f Dockerfile.dev'
                    sh 'docker push kaitohasei/kchat-backend-dev'
                }
            }
        }

        stage('Deploy Dev environment') {
            steps {
                sh 'docker pull kaitohasei/kchat-backend-dev'
                sh 'docker run -d -p 4000:4000 --name kchat-backend-dev kaitohasei/kchat-backend-dev'
            }
        }
    }
}