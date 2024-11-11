rm -rf flattened
mkdir flattened
for fileName in \
src/WormholeGuardiansAdapter.sol
  do
	echo $fileName
	flattened=flattened/`basename $fileName`
	forge flatten --output $flattened $fileName
done
