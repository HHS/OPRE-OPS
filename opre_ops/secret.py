import argparse
import string
import secrets


def generate_random_string(length):
    output = ''
    choice = string.digits + string.ascii_letters + string.punctuation
    choice = choice.replace("'", "")
    choice = choice.replace('"', '')
    for i in range(length):
        output += secrets.choice(choice)

    return output