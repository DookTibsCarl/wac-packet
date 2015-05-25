BEGIN {
	# We use quote-comma-quote as delimiter since there are commas within some fields and this is a quick & easy solution.
	# downside is that some fields have leading/trailing commas that we need to strip out. As luck would have it, we're
	# interested in both of those fields
	FS="\",\""
}

# Grab students who have marked their submission as "Complete"
"Not completed" == $41 || ("Completed" == $41 && ("Completed" != $17)) {
	$1 = substr($1, 2) # strip leading quote from name
	sub(/@carleton.edu/, "", $2) # strip domain from email
	sub(/"/, "", $42) # strip trailing quote from date

	# if ($41 == "Completed") {
	# } else {
	# }
	foo=$41 == "Completed" ? "missing metadata" : "not submitted"

	printf "%s|%s|%s\n", $2, $1, foo
}
