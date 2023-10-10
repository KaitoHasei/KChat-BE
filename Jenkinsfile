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
                    sh 'docker build -t kaitohasei/kchat-backend -f Dockerfile .'
                    sh 'docker push kaitohasei/kchat-backend'
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'kchat-backend-ec2', keyFileVariable: 'SSH_KEY', usernameVariable: 'REMOTE_SERVER')]) {
                    sh 'ssh -i $SSH_KEY $REMOTE_SERVER'
                    sh 'docker pull kaitohasei/kchat-backend'
                    sh 'docker run -d -p 80:4000 --name kchat-backend kaitohasei/kchat-backend'
                }
            }
        }
    }
}
