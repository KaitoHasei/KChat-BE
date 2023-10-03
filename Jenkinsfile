pipeline {
    agent any

    stages {
        stage('Packaging/Pushing image') {
            steps {
                script {
                    def secretFilePath = "${WORKSPACE}/.env"
                    
                    // Use the 'withCredentials' block to copy the secret file to the workspace
                    withCredentials([file(credentialsId: 'kchat-backend-env', variable: 'ENV_FILE')]) {
                        sh "cp ${ENV_FILE} ${secretFilePath}"
                    }
                }
                
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
