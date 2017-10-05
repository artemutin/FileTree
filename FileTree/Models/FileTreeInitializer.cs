using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;


namespace FileTree.Models
{
    public class FileTreeInitializer : DropCreateDatabaseAlways<FileTreeContext>
    {

        protected override void Seed(FileTreeContext context)
        {
            base.Seed(context);
            var treeEntry = new TreeEntry
            {
                Name = "/",
                IsFolder = true
            };

            var home = new TreeEntry { Name = "home/", IsFolder = true, Position = 1 };
            var usr = new TreeEntry { Name = "usr/", IsFolder = true, Position = 0 };
            treeEntry.Children = new List<TreeEntry> {
                usr,
                home,
                new TreeEntry { Name = "var/", IsFolder = true, Position = 2},
                new TreeEntry { Name = "tmp/", IsFolder = true, Position = 3},
                new TreeEntry { Name = "fstab", IsFolder = false, Position = 4}
            };
            usr.Children = new List<TreeEntry>
            {
                new TreeEntry { Name = "bin/", IsFolder=true},
                new TreeEntry { Name = "local/", IsFolder = true, Position = 1},
                new TreeEntry { Name = "someFile", IsFolder = false, Position = 2}
            };

            var images = new TreeEntry { Name = "Images/", IsFolder = true, Position = 2 };
            home.Children = new List<TreeEntry>
            {
                new TreeEntry { Name = ".zshrc", IsFolder = false },
                new TreeEntry { Name = "Downloads/", IsFolder=true, Position=1},
                images,
                new TreeEntry { Name = ".config/", IsFolder = true, Position=3}
            };
            images.Children = new List<TreeEntry>
            {
                new TreeEntry { Name = "cat.png", IsFolder = false},
                new TreeEntry { Name = "dog.png", IsFolder = false, Position = 1},
                new TreeEntry { Name = "pepe.png", IsFolder = false, Position = 2}
            };
            context.TreeEntries.Add(treeEntry);
        }
    }
}