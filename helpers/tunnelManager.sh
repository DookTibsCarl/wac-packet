#!/bin/bash

# opens/closes the ssh tunnel we use to talk to the database
op=$1
localPort=$2
remotePort=$3
username=$4
host=$5

showUsage=0

if [ -z $localPort ]; then
	showUsage=1
elif [ -z $remotePort ]; then
	showUsage=1
elif [ -z $username ]; then
	showUsage=1
elif [ -z $host ]; then
	showUsage=1
fi

if [ $showUsage -eq 0 ]; then
	cmd="ssh -L $localPort:127.0.0.1:$remotePort -N -f $username@$host"

	currentProcess=`ps -eax | grep "$cmd" | grep -v grep | awk '{print $1}'`

	if [ "open" = "$op" ]; then
		if [ ! -z $currentProcess ]; then
			echo "Tunnel is already open as pid $currentProcess; exiting"
		else
			echo "Opening tunnel via [$cmd]..."
			$cmd
		fi
	elif [ "close" = "$op" ]; then
		if [ ! -z $currentProcess ]; then
			echo "Killing tunnel running as pid $currentProcess..."
			kill $currentProcess
		else
			echo "Tunnel is not currently open; exiting"
		fi
	else
		showUsage=1
	fi
fi

if [ $showUsage -eq 1 ]; then
	echo "Usage: tunnelManager <open|close> <localPort> <remotePort> <user> <host>"
fi
