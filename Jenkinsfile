pipeline {
    agent any

    environment {
        AUTH_SESSION_URL = credentials('AUTH_SESSION_URL')
        SALT = credentials('SALT')
        TOKEN_SECRET = credentials('TOKEN_SECRET')
        DATABASE_URL = credentials('DATABASE_URL')
    }

    stages {
        stage('Packaging/Pushing image') {
            steps {
                withDockerRegistry(credentialsId: 'docker-hub',  url: 'https://index.docker.io/v1/') {
                    sh 'docker build -t kaitohasei/kchat-backend-dev -f Dockerfile.dev .'
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
