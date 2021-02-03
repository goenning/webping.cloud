regions=( "eastasia" "southeastasia" "australiaeast" "australiasoutheast" "australiacentral" "australiacentral2" "chinaeast" "chinanorth" "chinaeast2" "chinanorth2" "centralindia" "westindia" "southindia" "japaneast" "japanwest" "koreacentral" "koreasouth" "northeurope" "westeurope" "francecentral" "francesouth" "ukwest" "uksouth" "germanywestcentral" "germanynorth" "eastus" "eastus2" "centralus" "northcentralus" "southcentralus" "westcentralus" "westus" "westus2" "canadaeast" "canadacentral" "brazilsouth" "brazilsoutheast" "southafricanorth" "southafricawest" "norwayeast" "switzerlandwest" "switzerlandnorth" "uaecentral" "uaenorth" )
for i in "${regions[@]}"
do
  az storage account create -n wpc$i -g webping-cloud -l $i --sku Standard_LRS --only-show-errors
done