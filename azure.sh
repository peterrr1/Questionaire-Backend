read -p "Which step you'd like to run: " step
echo "${step}"

APP_NAME="questionaire"
ENV="dev"
LOCATION="westeurope"
RG="rg-${APP_NAME}-${ENV}"

ACR="${APP_NAME}acr${ENV}"

if [ $step = 1 ]
then
    # Step 1 creates the user group
    echo "Creating resource group..."

    az group create \
    --name "${RG}" \
    --location "${LOCATION}" \
    --tags environment=${ENV} app=${APP_NAME}

    az group show --name "${RG}" --query "properties.provisioningState"
elif [ $step = 2 ]
then
    # Step 2 creates the container registry
    echo "Creating Azure Container Registry..."

    az acr create \
        --resource-group "${RG}" \
        --name "${ACR}" \
        --sku Basic \
        --role-assignment-mode 'rbac-abac' \
        --dnl-scope TenantReuse

    az acr show \
        --name "${ACR}" \
        --query loginServer --output tsv

    az acr login --name ${ACR}
elif [ $step = 3 ]
then
    echo "Create a docker image and run it locally..."
    LOGIN_SERVER=$(az acr show \
        --name "${ACR}" \
        --query loginServer --output tsv)

    IMAGE_TAG="$(git rev-parse --short HEAD)"
    IMAGE="${LOGIN_SERVER}.azurecr.io/backend:${IMAGE_TAG}"

    docker build \
    --tag "${IMAGE}" \
    .

    docker run --rm -p 8080:8080 "${IMAGE}"
fi

