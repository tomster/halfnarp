from argparse import ArgumentParser
from pkg_resources import get_distribution
from subprocess import check_output

from . import project_name


def dev_version(**kw):
    parser = ArgumentParser(description='Print development version')
    parser.add_argument('-f', '--full', dest='full', action='store_true',
        help='output full version')
    args = parser.parse_args(**kw)
    cmd = 'git describe --long --tags --dirty --always'
    version = check_output(cmd.split()).strip()
    if not args.full:
        dist = get_distribution(project_name)
        version = version.replace(dist.version, '', 1)
    print(version)
