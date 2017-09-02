import argparse
import re
import json
import os

parser = argparse.ArgumentParser(description='Bleh')
parser.add_argument('-d', '--delete', help='Delete source file after parsing', action='store_true')
parser.add_argument('source', help='Source file for conversation (in Entweedle format)')
parser.add_argument('dest', help='Destination file for conversation (in JSON)')
args = parser.parse_args()

source_file = open(args.source, 'r')
source_raw = source_file.read()
source_file.close()

source_nodes = [re.split(r'[\n]+', x) for x in re.split(':: ', source_raw) if len(x) > 0]
conv_title = source_nodes[0][1]	#title of conversation - not actually used
conv_nodes = source_nodes[3:]
conv_dict = {}		#map of node title -> node info
main_speaker = ""	#default speaker - any nodes without speaker tag are assumed to have this speaker

titlesToIds = {}	#for changing node titles to indices

def createConvNode(node, id):
	node_title_split = re.split(r'[\[\]]', node[0])

	# get node name (to be changed to index later)
	node_name = node_title_split[0]

	# get speaker name
	if len(node_title_split) < 2 or len(node_title_split[1]) == 0:
		speaker = main_speaker
	else:
		speaker = node_title_split[1].replace('_', ' ')

	node_text = ''
	node_responses = []
	comments = []
	actions = {}
	showOnce = 0;

	# go through node line by line
	for line in node[1:]:
		if len(line) == 0:
			continue
		# this is a response line
		if line.startswith("[[") and line.endswith("]]"):
			response = re.split('->', line[2:-2])
			if len(response) == 1:
				node_responses.append({'text': response[0], 'target': response[0]})
			else:
				node_responses.append({'text': response[0], 'target': response[1]})
		# this is a comment line
		elif line.startswith("<!--"):
			# check if this is a node that should only be shown once
			if line[len("<!--"):len("<!--SHOW_ONCE")] == "SHOW_ONCE":
				showOnce = 1;
			else:
				comments.append(line)
		# this line sets a variable
		elif line.startswith("(set:"):
			action = [x for x in re.split(r'[\$) ]', line) if len(x) > 0]
			action_variable = action[1]
			action_value = action[3]
			actions[action_variable] = action_value
		# this line checks for a variable
		elif line.startswith("(if:"):
			cond_and_response = re.split(r'\)\[\[\[', line)
			response = cond_and_response[1][:-3]
			conds = [x.strip() for x in re.split(r'and', cond_and_response[0][5:])]
			conditions = {}
			for cond in conds:
				cond = [x for x in re.split(r'[\$) ]', cond) if len(x) > 0]
				cond_var = cond[0]
				if cond[2] == "not":
					cond_val = "!" + cond[3]
				else:
					cond_val = cond[2]
				conditions[cond_var] = cond_val
			response = re.split('->', response)
			if len(response) == 1:
				node_responses.append({'text': response[0], 'target': response[0], 'conditions': conditions})
			else:
				node_responses.append({'text': response[0], 'target': response[1], 'conditions': conditions})
		# this line is part of the text for this node
		elif line[0] != '{' and line[0] != '}':
			node_text = node_text + line + '\n'

	# if there are no responses to this node, make it an end node
	if len(node_responses) == 0:
		node_responses.append({'text': 'END', 'target': -1})

	node_text = node_text.strip()
	titlesToIds[node_name] = id

	return {
		'id': id,
		'name': node_name,
		'text': node_text,
		'comments': comments,
		'responses': node_responses,
		'actions': actions,
		'speaker': speaker,
		'showOnce': showOnce
	}

conv_dict['start'] = createConvNode(conv_nodes[0], 0)	# this is the NPC greeting and conversation root
main_speaker = conv_dict['start']['speaker']			# this is the main speaker in the conversation

# populate map of node title -> node info
for i, node in enumerate(conv_nodes):
	conv_node = createConvNode(node, i)
	conv_dict[conv_node['name']] = conv_node

# populate map of node index -> node info, remap targets
conv_dict_idx = {}
for node_name in conv_dict:
	node = conv_dict[node_name]
	for response in node['responses']:
		if response['target'] != -1:
			response['target'] = titlesToIds[response['target']]
	del node['name']
	conv_dict_idx[node['id']] = node

# write to JSON file
with open(args.dest, 'w') as dest_file:
	json.dump(conv_dict_idx, dest_file, sort_keys=True, indent=4, separators=(',', ': '))

# if delete flag is set, delete source file
if args.delete:
	os.remove(args.source)