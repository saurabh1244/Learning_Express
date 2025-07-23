pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
    }

    stages {
        stage('Install Dependencies') {
            steps {
                    echo 'Installing dependencies...'
                    sh 'npm install'
            }
        }

        stage('Prisma Generate') {
            steps {
                    echo 'Generating Prisma client...'
                    sh 'npx prisma generate'
            }
        }

        stage('Deploy Prisma Migrations') {
            steps {
                    echo '🛠 Deploying Prisma migrations...'
                    sh 'npx prisma migrate deploy'
            }
        }

        // Uncomment if you have a build script
        // stage('Build') {
        //     steps {
        //         dir('backend') {
        //             echo '🛠 Running build script...'
        //             sh 'npm run build || echo "⚠️ No build script found"'
        //         }
        //     }
        // }

        stage('Restart Server with PM2') {
            steps {
                    echo 'Restarting server with PM2...'
                    sh '''
                    if pm2 list | grep -q backend; then
                        pm2 restart learning_express_backend
                    else
                        pm2 start src/index.js --name learning_express_backend
                    fi
                    '''
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Build or deployment failed.'
        }
    }
}