using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;

namespace FileTree.Models
{
    public class TreeEntry
    {
        public int id { get; set; }
        public string name { get; set; }
        public bool isFolder { get; set; }
    }

    public class ParentChildPair
    {
        public int id { get; set; }
        public int parentId { get; set; }
        public int childId { get; set; }
    }

    public class FileTreeContext: DbContext
    {
        public DbSet<TreeEntry> TreeEntries { get; set; }
        public DbSet<ParentChildPair> ParentChildPairs { get; set; }
    }

}