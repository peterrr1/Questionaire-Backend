acr_name=crdevweqairedemo01
echo "Loggin into acr..."
az acr login --name $acr_name

echo "Building docker image..."
docker build --platform linux/amnd64 -t crdevweqairedemo01.azurecr.io/questionaire-dev:latest .

echo "Pushing image to repositiory..."
docker push crdevweqairedemo01.azurecr.io/questionaire-dev
