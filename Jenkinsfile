pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }

    stages {
        stage('Checkout Git') {
            steps {
                checkout scm
                sh 'git log -1 --oneline'
            }
        }

        stage('Verify Application') {
            steps {
                sh '''
                    test -f Dockerfile
                    test -f package.json
                    test -f hello-world.js
                    echo "Application files verified"
                '''
            }
        }

        stage('Check Node.js') {
            steps {
                sh '''
                    node --version
                    npm --version
                '''
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test'
            }
        }
    }

    post {
        success {
            echo 'Hello Node CI pipeline successful!'
        }

        failure {
            echo 'Pipeline failed. Check console output.'
        }
    }
}
